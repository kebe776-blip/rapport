@echo off
chcp 65001 >nul
title Rapport de rentree elementaire 2025/2026 - KoboToolbox

echo ============================================================
echo   RAPPORT GENERAL DE RENTREE ELEMENTAIRE 2025/2026
echo   Generation automatique du PDF officiel
echo ============================================================
echo.

REM --- Configuration KoboToolbox (a completer) -------------------
REM set KOBO_API_URL=https://kf.kobotoolbox.org
REM set KOBO_TOKEN=VOTRE_JETON_API_ICI
REM set KOBO_ASSET_UID=UID_DU_FORMULAIRE_ICI
REM ----------------------------------------------------------------

if "%KOBO_TOKEN%"=="" (
  echo   Mode DEMONSTRATION : donnees d'exemple utilisees.
  echo   Renseignez KOBO_TOKEN et KOBO_ASSET_UID pour la production.
  echo.
)

echo   Application : http://127.0.0.1:5000
echo   Apercu PDF  : http://127.0.0.1:5000/demo/pdf
echo.
python app.py
pause
