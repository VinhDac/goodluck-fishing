#!/usr/bin/env python3
"""GOODLUCK FISHING, THE APP, AS AN INSTALLER (PLAN.md 15, step 1: «game thật, ứng dụng thật làm exe»).

    python tools/make_exe.py        -> dist/GoodLuck-Fishing-Setup-<version>.exe

The app (app/, with the game's own pages: index.html, css/, js/, img/, skills.json, and the fleet's boards:
store/boards.json) compiled by Nuitka into GoodLuckFishing.exe, no source in it, and put by Inno Setup in the person's own
Programs folder, with its own shortcut and its own entry in Windows' list of apps. Its data stays in
%LOCALAPPDATA%\\goodluck-fishing: removing or reinstalling the app keeps it.

The build tools are GoodLuck's (JobA-Z: scripts/make_exe.py --setup), in %LOCALAPPDATA%\\jobbot-build: a Python with
Nuitka and pywebview, and Inno Setup 6. This build keeps its own stage and output there, fishing-stage and
fishing-out, so it never meets GoodLuck's builds. Windows only.
"""

from __future__ import annotations

import os
import shutil
import struct
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME = "GoodLuck Fishing"
FILE = "GoodLuckFishing"
OWNER = "Vinh Dac"
TOOLS = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "jobbot-build"
PY = TOOLS / "venv" / "Scripts" / "python.exe"
ISCC = [Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Inno Setup 6" / "ISCC.exe",
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Inno Setup 6" / "ISCC.exe"]
STAGE = TOOLS / "fishing-stage"
OUT = TOOLS / "fishing-out"
BUILT = OUT / "fishing.dist"                   # Nuitka names it after the entry
DIST = ROOT / "dist"
# WINDOWS KNOWS THE APP BY THIS ID: a reinstall with the same one replaces the old copy. Never change it.
APP_ID = "F25C83BE-F1BA-4876-8932-1F241FCEAF84"
GAME_DIRS = ("css", "js", "img")
GAME_FILES = ("index.html", "manifest.webmanifest", "skills.json", "store/boards.json")

# THE COMPILED PROGRAM'S FIRST LINES: a windowless program has nowhere to write, so its words go to a log in its data
# folder; a valid standard input for any program it starts later (Chrome: GoodLuck learned «The handle is invalid»).
ENTRY = '''import ctypes
import os
import sys

_data = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "goodluck-fishing")
os.makedirs(_data, exist_ok=True)
if not ctypes.windll.kernel32.GetConsoleWindow():
    try:
        sys.stdout = sys.stderr = open(os.path.join(_data, "fishing.log"), "a", encoding="utf-8", buffering=1)
    except OSError:
        sys.stdout = sys.stderr = None
    try:
        import msvcrt
        _nul = os.open(os.devnull, os.O_RDONLY)
        ctypes.windll.kernel32.SetStdHandle(ctypes.c_uint32(-10 & 0xFFFFFFFF), ctypes.c_void_p(msvcrt.get_osfhandle(_nul)))
    except Exception:
        pass

from app.main import main
try:
    sys.exit(main())
except SystemExit:
    raise
except BaseException:
    import traceback
    traceback.print_exc()
    raise
'''

ISS = r"""[Setup]
AppId={{<APP_ID>}
AppName=<NAME>
AppVersion=<VERSION>
AppVerName=<NAME> <VERSION>
AppPublisher=<OWNER>
DefaultDirName={autopf}\<NAME>
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=<OUTDIR>
OutputBaseFilename=GoodLuck-Fishing-Setup-<VERSION>
SetupIconFile=<ICON>
UninstallDisplayIcon={app}\<FILE>.exe
UninstallDisplayName=<NAME>
VersionInfoVersion=<VERSION>
VersionInfoProductName=<NAME>
WizardStyle=modern
Compression=lzma2/max
SolidCompression=yes
CloseApplications=yes
RestartApplications=no

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "<BUILT>\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\<NAME>"; Filename: "{app}\<FILE>.exe"; Comment: "Ten minutes a day: a sky full of real jobs to fish"
Name: "{autodesktop}\<NAME>"; Filename: "{app}\<FILE>.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\<FILE>.exe"; Description: "{cm:LaunchProgram,<NAME>}"; Flags: nowait postinstall skipifsilent
"""


def version(now: datetime | None = None) -> str:
    """This build's number: 0.<month and day>.<hour and minute>, each later build's larger, as Windows reads them."""
    now = now or datetime.now()
    return f"0.{now.month * 100 + now.day}.{now.hour * 100 + now.minute}"


def ico(pngs: list[Path]) -> bytes:
    """A Windows icon holding the game's own duck pictures as they are (an icon may carry PNGs whole)."""
    images = [p.read_bytes() for p in pngs]
    head = struct.pack("<HHH", 0, 1, len(images))
    offset, entries = 6 + 16 * len(images), b""
    for data in images:
        w, h = struct.unpack(">II", data[16:24])
        entries += struct.pack("<BBBBHHII", w % 256, h % 256, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    return head + entries + b"".join(images)


def stage(ver: str) -> Path:
    if STAGE.exists():
        shutil.rmtree(STAGE)
    shutil.copytree(ROOT / "app", STAGE / "app", ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    (STAGE / "app" / "_built.py").write_text(f"# Written by tools/make_exe.py\nVERSION = {ver!r}\n", encoding="utf-8")
    (STAGE / f"{FILE}.ico").write_bytes(ico([ROOT / "img" / "icon-192.png", ROOT / "img" / "duck-64.png"]))
    entry = STAGE / "fishing.py"
    entry.write_text(ENTRY, encoding="utf-8")
    return entry


def run(cmd: list, **kw) -> int:
    print("  $ " + " ".join(str(c) for c in cmd)[:200], flush=True)
    return subprocess.call([str(c) for c in cmd], **kw)


def compile_(entry: Path, ver: str) -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    data = [f"--include-data-dir={ROOT / d}={d}" for d in GAME_DIRS]
    data += [f"--include-data-files={ROOT / f}={f}" for f in GAME_FILES]
    return run([
        PY, "-m", "nuitka", "--standalone", "--assume-yes-for-downloads",
        "--msvc=latest", "--deployment", "--windows-console-mode=disable", "--python-flag=no_docstrings",
        f"--windows-icon-from-ico={STAGE / f'{FILE}.ico'}",
        f"--output-dir={OUT}", f"--output-filename={FILE}.exe",
        f"--company-name={OWNER}", f"--product-name={NAME}", f"--file-description={NAME}",
        f"--file-version={ver}", f"--product-version={ver}", f"--copyright=Copyright 2026 {OWNER}",
        "--include-package=app",                    # pywebview is Nuitka's own plugin's to take: naming it only conflicts
        *data, entry], cwd=STAGE)


def check() -> list[str]:
    """What the built folder must hold, and must not."""
    need = [f"{FILE}.exe", "index.html", "js/game.js", "js/fleet.js", "css/lobby.css", "skills.json", "store/boards.json"]
    wrong = [f"missing {n}" for n in need if not (BUILT / n).is_file()]
    wrong += [f"source left in: {p.relative_to(BUILT)}" for p in BUILT.rglob("*.py") if "app" in p.parts or p.name == "fishing.py"]
    home = str(Path.home()).encode()
    for f in BUILT.rglob("*"):
        if f.is_file() and f.suffix.lower() in (".exe", ".dll", ".pyd", ".js", ".html", ".css"):
            data = f.read_bytes()
            if home in data or home.decode().encode("utf-16-le") in data:
                wrong.append(f"names the build folder: {f.relative_to(BUILT)}")
    return wrong


def package(ver: str) -> Path | None:
    tool = next((t for t in ISCC if t.is_file()), None)
    if not tool:
        print("  Inno Setup 6 is not installed (GoodLuck: python scripts/make_exe.py --setup)")
        return None
    DIST.mkdir(parents=True, exist_ok=True)
    text = ISS
    for k, v in {"<APP_ID>": APP_ID, "<NAME>": NAME, "<VERSION>": ver, "<OWNER>": OWNER, "<FILE>": FILE,
                 "<OUTDIR>": DIST, "<ICON>": STAGE / f"{FILE}.ico", "<BUILT>": BUILT}.items():
        text = text.replace(k, str(v))
    iss = STAGE / "setup.iss"
    iss.write_text(text, encoding="utf-8-sig")
    if run([tool, "/Q", iss]) != 0:
        return None
    out = DIST / f"GoodLuck-Fishing-Setup-{ver}.exe"
    return out if out.is_file() else None


def main() -> int:
    if sys.platform != "win32":
        print("  GoodLuck Fishing's installer is built on Windows.")
        return 1
    if not PY.is_file():
        print("  No build tools yet (GoodLuck: python scripts/make_exe.py --setup)")
        return 1
    ver = version()
    entry = stage(ver)
    if compile_(entry, ver) != 0:
        print("\n  NOT BUILT: Nuitka failed (above).")
        return 1
    wrong = check()
    if wrong:
        print("\n  NOT BUILT: the compiled app is not right:")
        for w in wrong[:20]:
            print(f"    {w}")
        return 1
    size = sum(f.stat().st_size for f in BUILT.rglob("*") if f.is_file()) / 1e6
    print(f"\n  Compiled: {BUILT}  ({size:.0f} MB)")
    setup_exe = package(ver)
    if not setup_exe:
        print("  NOT PACKAGED: Inno Setup failed or is missing.")
        return 1
    print(f"  Built {NAME} {ver}")
    print(f"  Installer: {setup_exe}  ({setup_exe.stat().st_size / 1e6:.1f} MB)")
    print("  Its data:  %LOCALAPPDATA%\\goodluck-fishing\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
