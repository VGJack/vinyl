!ifndef VINYL_USER_INSTALL_ROOT
  !define VINYL_USER_INSTALL_ROOT "$LOCALAPPDATA\Programs"
!endif

!macro vinylInstallPreflight
    ; Recover a failed per-user installation whose registered folder is gone.
    ; Do not change a live installation or an explicitly different destination.
    ReadRegStr $R3 HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
    ${If} $installMode == "CurrentUser"
    ${AndIf} $R3 != ""
    ${AndIf} $INSTDIR == $R3
      ${IfNot} ${FileExists} "$R3\*.*"
        StrCpy $INSTDIR "${VINYL_USER_INSTALL_ROOT}\${APP_FILENAME}"
        StrCpy $appExe "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
      ${EndIf}
    ${EndIf}
    ; Fail before uninstallOldVersion, rather than leaving a half-removed app.
    CreateDirectory "$INSTDIR"
    ClearErrors
    FileOpen $R3 "$INSTDIR\.vinyl-write-test-$HWNDPARENT.tmp" w
    ${If} ${Errors}
      MessageBox MB_OK|MB_ICONSTOP "Vinyl cannot write to $INSTDIR. For a per-user installation, choose $LOCALAPPDATA\Programs\Vinyl. To use Program Files, restart setup as administrator. Your existing installation has not been removed." /SD IDOK
      SetErrorLevel 5
      Quit
    ${EndIf}
    FileClose $R3
    Delete "$INSTDIR\.vinyl-write-test-$HWNDPARENT.tmp"
    ${If} ${FileExists} "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
      ClearErrors
      ; Append mode opens the existing file without truncating or writing to it.
      FileOpen $R3 "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe" a
      ${If} ${Errors}
        MessageBox MB_OK|MB_ICONSTOP "The existing Vinyl uninstaller is locked or not writable. Close any other Vinyl setup/uninstall window and run setup again. If Vinyl is in Program Files, run setup as administrator. No application files have been removed." /SD IDOK
        SetErrorLevel 5
        Quit
      ${EndIf}
      FileClose $R3
    ${EndIf}
!macroend

!macro customCheckAppRunning
  !ifndef BUILD_UNINSTALLER
    !insertmacro vinylInstallPreflight
  !endif
  InitPluginsDir
  File /oname=$PLUGINSDIR\close-installed-app.ps1 "${PROJECT_DIR}\scripts\close-installed-app.ps1"
  nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\close-installed-app.ps1" -InstallDirectory "$INSTDIR" -CheckOnly'
  Pop $R0
  Pop $R2
  ${If} $R0 == 10
    ${IfNot} ${isUpdated}
      MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "Vinyl must close to install this update. Save any work in open pages before continuing." /SD IDOK IDOK vinyl_close
      Quit
    ${EndIf}
    vinyl_close:
    nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\close-installed-app.ps1" -InstallDirectory "$INSTDIR"'
    Pop $R0
    Pop $R2
  ${EndIf}
  ${If} $R0 != 0
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Vinyl could not close at $INSTDIR. Close that copy of Vinyl, then retry. $R2" /SD IDCANCEL IDRETRY vinyl_close
    Quit
  ${EndIf}
!macroend
