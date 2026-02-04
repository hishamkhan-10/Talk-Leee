@echo off
setlocal enabledelayedexpansion

REM ====== SAFE GITHUB PUSH (NO EMBEDDED TOKENS) ======
REM Usage:
REM   push-safe.bat           (HTTPS + Git Credential Manager)
REM   push-safe.bat --ssh     (SSH)

cd /d "C:\Users\User\Desktop\Talk-Leee"

set "COMMIT_MESSAGE=Update from TRAE agent"
set "REPO_HTTPS=https://github.com/hishamkhan-10/Talk-Leee.git"
set "REPO_SSH=git@github.com:hishamkhan-10/Talk-Leee.git"
set "REMOTE_URL=%REPO_HTTPS%"

if /I "%~1"=="--ssh" set "REMOTE_URL=%REPO_SSH%"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Initializing Git repository...
  git init
)

git config credential.helper manager-core >nul 2>&1

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo Adding remote origin...
  git remote add origin "%REMOTE_URL%"
) else (
  git remote set-url origin "%REMOTE_URL%"
)

git add -A

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MESSAGE%"
) else (
  echo No staged changes to commit.
)

git branch -M main
git push -u origin main

echo.
echo Push completed.
exit /b 0
