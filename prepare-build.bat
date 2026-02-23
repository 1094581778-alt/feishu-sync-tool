@echo off
chcp 65001 > nul

echo Preparing build directory...

:: Create a clean build directory
if exist "build" rd /s /q "build"
mkdir "build"

:: Copy only necessary files from .next
xcopy ".next\static" "build\static" /E /I /Y > nul
xcopy ".next\BUILD_ID" "build\" /Y > nul
xcopy ".next\build-manifest.json" "build\" /Y > nul
xcopy ".next\app-path-routes-manifest.json" "build\" /Y > nul

echo Build directory prepared successfully!
