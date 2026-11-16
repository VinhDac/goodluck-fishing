"""THE WINDOW'S OWN FRAME TAKEN OFF, ON WINDOWS, AND THE GAME'S TITLE BAR DRAWN IN ITS PLACE (Vin, 16/11: «custom cho tôi
title bar cho đẹp cho khớp với game đi»). Windows 10 will not recolour the system caption (DWMWA_CAPTION_COLOR is
Windows 11's), so the frame goes, the page draws the bar as the game draws its signs (js/winbar.js), and four patches
give back what went with the frame:

  1. WS_THICKFRAME      the resizing border; it survives maximize and restore
  2. WM_NCCALCSIZE = 0  or the content sits 7px in from every edge
  3. WM_GETMINMAXINFO   or maximize covers the taskbar
  4. WM_DRAG            dragging and resizing, started by the page

WebView2 is a child window covering the whole window, so Windows asks the child, never this window, what is under the
pointer: the page sees the mouse, so the page starts the drag or the resize, and this window runs Windows' own loop for
it (Aero Snap, double-click to maximize and the edges all come with it).

Copied from GoodLuck's src/jobbot/winframe.py (itself Jenifer Studio's khung_cua_so.py), cut down to one plain window.
Everything is wrapped: a patch that fails leaves a frameless window that still works, plain rather than broken.
"""

from __future__ import annotations

import ctypes
from ctypes import wintypes
from pathlib import Path

u = ctypes.WinDLL("user32", use_last_error=True)
dwm = ctypes.WinDLL("dwmapi")

u.GetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int]
u.GetWindowLongPtrW.restype = ctypes.c_ssize_t
u.SetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
u.SetWindowLongPtrW.restype = ctypes.c_ssize_t
u.CallWindowProcW.argtypes = [ctypes.c_void_p, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
u.CallWindowProcW.restype = ctypes.c_ssize_t
u.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
u.MonitorFromWindow.argtypes = [wintypes.HWND, wintypes.DWORD]
u.MonitorFromWindow.restype = ctypes.c_void_p
u.GetMonitorInfoW.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
u.IsZoomed.argtypes = [wintypes.HWND]
u.IsIconic.argtypes = [wintypes.HWND]
u.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
u.SetForegroundWindow.argtypes = [wintypes.HWND]
u.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
u.SendMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
u.SendMessageW.restype = ctypes.c_ssize_t
u.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
u.GetCursorPos.argtypes = [ctypes.POINTER(wintypes.POINT)]
dwm.DwmExtendFrameIntoClientArea.argtypes = [wintypes.HWND, ctypes.c_void_p]
u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
u.IsWindowVisible.argtypes = [wintypes.HWND]
u.GetWindowTextLengthW.argtypes = [wintypes.HWND]
u.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]

GWL_STYLE, GWL_WNDPROC = -16, -4
WS_THICKFRAME, WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_SYSMENU = 0x40000, 0x10000, 0x20000, 0x80000
SWP_FRAMECHANGED, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_NOACTIVATE = 0x0020, 0x0002, 0x0001, 0x0004, 0x0010
WM_NCCALCSIZE, WM_GETMINMAXINFO, WM_NCHITTEST, WM_NCLBUTTONDOWN, WM_SETICON = 0x0083, 0x0024, 0x0084, 0x00A1, 0x0080
WM_DRAG = 0x8000 + 11                        # the app's own message: the page asks for one of Windows' drag or resize loops
HTCAPTION = 2
DRAGS = {HTCAPTION, 10, 11, 12, 13, 14, 15, 16, 17}   # the caption, then the edges and corners, by Windows' own codes

WNDPROC = ctypes.WINFUNCTYPE(ctypes.c_ssize_t, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)


class MINMAXINFO(ctypes.Structure):
    _fields_ = [("ptReserved", wintypes.POINT), ("ptMaxSize", wintypes.POINT), ("ptMaxPosition", wintypes.POINT),
                ("ptMinTrackSize", wintypes.POINT), ("ptMaxTrackSize", wintypes.POINT)]


class MONITORINFO(ctypes.Structure):
    _fields_ = [("cbSize", wintypes.DWORD), ("rcMonitor", wintypes.RECT), ("rcWork", wintypes.RECT), ("dwFlags", wintypes.DWORD)]


class MARGINS(ctypes.Structure):
    _fields_ = [("cxLeftWidth", ctypes.c_int), ("cxRightWidth", ctypes.c_int), ("cyTopHeight", ctypes.c_int), ("cyBottomHeight", ctypes.c_int)]


class Frame:
    """One patched window. It HOLDS ON TO ITS CALLBACK: let Python collect it while Windows still calls it and the app
    dies at some later repaint."""

    def __init__(self) -> None:
        self.hwnd = None
        self._new_proc = None
        self._old_proc = None

    def start_drag(self, code: int) -> bool:
        """Windows' own drag (HTCAPTION) or resize (an edge's code). Posted, not called: ReleaseCapture works only on the
        window's own thread, and this is asked from pywebview's."""
        try:
            if not self.hwnd or int(code) not in DRAGS:
                return False
            u.PostMessageW(self.hwnd, WM_DRAG, int(code), 0)
            return True
        except Exception:                                                  # noqa: BLE001
            return False

    def maximized(self) -> bool:
        try:
            return bool(self.hwnd and u.IsZoomed(self.hwnd))
        except Exception:                                                  # noqa: BLE001
            return False

    def front(self) -> None:
        try:
            if self.hwnd:
                u.ShowWindow(self.hwnd, 9 if u.IsIconic(self.hwnd) else 5)   # RESTORE / SHOW
                u.SetForegroundWindow(self.hwnd)
        except Exception:                                                  # noqa: BLE001
            pass

    def patch(self, hwnd) -> bool:
        """True when every patch took; False when it gave up (the window still works)."""
        try:
            self.hwnd = hwnd
            style = u.GetWindowLongPtrW(hwnd, GWL_STYLE)
            u.SetWindowLongPtrW(hwnd, GWL_STYLE, style | WS_MINIMIZEBOX | WS_SYSMENU | WS_THICKFRAME | WS_MAXIMIZEBOX)
            dwm.DwmExtendFrameIntoClientArea(hwnd, ctypes.byref(MARGINS(0, 0, 1, 0)))   # the shadow and the window's edge
            border = u.GetSystemMetrics(32) + u.GetSystemMetrics(92)                   # SIZEFRAME + PADDEDBORDER

            def proc(h, msg, wp, lp):
                try:
                    if msg == WM_NCCALCSIZE and wp:
                        return 0                                           # the content is the whole window
                    if msg == WM_GETMINMAXINFO:
                        info = MONITORINFO()
                        info.cbSize = ctypes.sizeof(MONITORINFO)
                        if u.GetMonitorInfoW(u.MonitorFromWindow(h, 2), ctypes.byref(info)):
                            mm = ctypes.cast(lp, ctypes.POINTER(MINMAXINFO)).contents
                            work, screen = info.rcWork, info.rcMonitor
                            mm.ptMaxPosition.x, mm.ptMaxPosition.y = work.left - screen.left, work.top - screen.top
                            mm.ptMaxSize.x, mm.ptMaxSize.y = work.right - work.left, work.bottom - work.top
                            mm.ptMaxTrackSize.x, mm.ptMaxTrackSize.y = mm.ptMaxSize.x, mm.ptMaxSize.y
                            return 0
                    if msg == WM_DRAG:                                     # on the window's own thread now; the pointer is the anchor
                        u.ReleaseCapture()
                        point = wintypes.POINT()
                        u.GetCursorPos(ctypes.byref(point))
                        u.SendMessageW(h, WM_NCLBUTTONDOWN, int(wp), ((point.y & 0xFFFF) << 16) | (point.x & 0xFFFF))
                        return 0
                    if msg == WM_NCHITTEST:
                        edge = self._edge(h, lp, border)                   # a safety net, where the child does not cover
                        if edge:
                            return edge
                except Exception:                                          # noqa: BLE001
                    pass                                                   # an error here kills the app: the old proc takes it
                return u.CallWindowProcW(self._old_proc, h, msg, wp, lp)

            self._new_proc = WNDPROC(proc)
            self._old_proc = ctypes.c_void_p(u.SetWindowLongPtrW(hwnd, GWL_WNDPROC, ctypes.cast(self._new_proc, ctypes.c_void_p).value))
            u.SetWindowPos(hwnd, None, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE)
            return True
        except Exception:                                                  # noqa: BLE001
            return False

    @staticmethod
    def _edge(h, lp, border) -> int:
        if u.IsZoomed(h):
            return 0
        x, y = ctypes.c_short(lp & 0xFFFF).value, ctypes.c_short((lp >> 16) & 0xFFFF).value
        r = wintypes.RECT()
        u.GetWindowRect(h, ctypes.byref(r))
        left, right, top, bottom = x < r.left + border, x >= r.right - border, y < r.top + border, y >= r.bottom - border
        for hit, code in ((top and left, 13), (top and right, 14), (bottom and left, 16), (bottom and right, 17),
                          (left, 10), (right, 11), (top, 12), (bottom, 15)):
            if hit:
                return code
        return 0


def find_window(pid: int, title: str):
    """This process's visible window with exactly this title."""
    found = []

    @ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    def each(hwnd, _param):
        owner = wintypes.DWORD()
        u.GetWindowThreadProcessId(hwnd, ctypes.byref(owner))
        if owner.value == pid and u.IsWindowVisible(hwnd):
            n = u.GetWindowTextLengthW(hwnd)
            text = ctypes.create_unicode_buffer(n + 1)
            u.GetWindowTextW(hwnd, text, n + 1)
            if text.value == title:
                found.append(hwnd)
        return True

    u.EnumWindows(each, 0)
    return found[0] if found else None


def set_icons(hwnd, png: Path) -> None:
    """The duck on the taskbar and in Alt+Tab, not Python's: the game's own PNG, as an icon may carry one whole."""
    try:
        data = png.read_bytes()
        u.CreateIconFromResourceEx.restype = wintypes.HICON
        u.CreateIconFromResourceEx.argtypes = [ctypes.c_void_p, wintypes.DWORD, wintypes.BOOL, wintypes.DWORD, ctypes.c_int, ctypes.c_int, wintypes.UINT]
        small = u.GetSystemMetrics(49) or 16                               # SM_CXSMICON
        for which, size in ((0, small), (1, round(small * 1.5))):          # ICON_SMALL, ICON_BIG at the taskbar's own size
            buffer = (ctypes.c_ubyte * len(data)).from_buffer_copy(data)
            icon = u.CreateIconFromResourceEx(buffer, len(data), True, 0x00030000, size, size, 0)
            if icon:
                u.SendMessageW(hwnd, WM_SETICON, which, icon)
    except Exception:                                                      # noqa: BLE001
        pass
