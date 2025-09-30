# Guest Check-in System Log Viewer for PowerShell
param(
    [string]$Command = "help",
    [string]$LogFile = "",
    [int]$Lines = 50
)

$LogsDir = Join-Path $PSScriptRoot ".." "logs"

function Show-Help {
    Write-Host "Guest Check-in System Log Viewer" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\log-viewer.ps1 list                    - List all log files"
    Write-Host "  .\log-viewer.ps1 tail <file> [lines]    - Show last N lines (default: 50)"
    Write-Host "  .\log-viewer.ps1 watch <file>           - Watch file for new entries"
    Write-Host "  .\log-viewer.ps1 errors                 - Show recent errors"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\log-viewer.ps1 tail combined.log 100"
    Write-Host "  .\log-viewer.ps1 watch webhooks.log"
    Write-Host "  .\log-viewer.ps1 errors"
    
    if (Test-Path $LogsDir) {
        List-LogFiles
    }
}

function List-LogFiles {
    if (-not (Test-Path $LogsDir)) {
        Write-Host "Logs directory not found: $LogsDir" -ForegroundColor Red
        return
    }
    
    $files = Get-ChildItem $LogsDir -Filter "*.log"
    
    Write-Host ""
    Write-Host "Available log files:" -ForegroundColor Green
    
    foreach ($file in $files) {
        $size = "{0:N1} KB" -f ($file.Length / 1KB)
        $modified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "  $($file.Name)" -ForegroundColor Cyan -NoNewline
        Write-Host " ($size, modified: $modified)" -ForegroundColor Gray
    }
}

function Format-LogEntry {
    param([string]$Entry)
    
    try {
        $log = $Entry | ConvertFrom-Json
        $timestamp = [DateTime]::Parse($log.timestamp).ToString("HH:mm:ss")
        
        $levelColor = switch ($log.level) {
            "error" { "Red" }
            "warn" { "Yellow" }
            "info" { "Green" }
            "debug" { "Cyan" }
            default { "White" }
        }
        
        Write-Host "$timestamp " -NoNewline -ForegroundColor Gray
        Write-Host "[$($log.level.ToUpper())]" -NoNewline -ForegroundColor $levelColor
        
        if ($log.context) {
            Write-Host " [$($log.context)]" -NoNewline -ForegroundColor Magenta
        }
        
        Write-Host ": $($log.message)" -ForegroundColor White
        
        if ($log.error) {
            Write-Host "  Error: $($log.error)" -ForegroundColor Red
        }
        
        if ($log.guestId) {
            Write-Host "  Guest ID: $($log.guestId)" -ForegroundColor Blue
        }
        
        if ($log.guestName) {
            Write-Host "  Guest: $($log.guestName)" -ForegroundColor Blue
        }
        
        if ($log.ip) {
            Write-Host "  IP: $($log.ip)" -ForegroundColor Cyan
        }
        
    } catch {
        Write-Host $Entry -ForegroundColor Gray
    }
}

function Show-LogTail {
    param([string]$Filename, [int]$LineCount)
    
    $filepath = Join-Path $LogsDir $Filename
    
    if (-not (Test-Path $filepath)) {
        Write-Host "Log file not found: $filepath" -ForegroundColor Red
        return
    }
    
    Write-Host "=== Last $LineCount lines of $Filename ===" -ForegroundColor Cyan
    Write-Host ""
    
    $content = Get-Content $filepath -Tail $LineCount
    
    foreach ($line in $content) {
        if ($line.Trim()) {
            Format-LogEntry $line
        }
    }
}

function Watch-LogFile {
    param([string]$Filename)
    
    $filepath = Join-Path $LogsDir $Filename
    
    if (-not (Test-Path $filepath)) {
        Write-Host "Log file not found: $filepath" -ForegroundColor Red
        return
    }
    
    Write-Host "=== Watching $Filename (Press Ctrl+C to stop) ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Show last 10 lines first
    Show-LogTail $Filename 10
    
    Write-Host ""
    Write-Host "--- Live updates ---" -ForegroundColor Cyan
    
    $lastSize = (Get-Item $filepath).Length
    
    while ($true) {
        Start-Sleep -Seconds 1
        
        $currentSize = (Get-Item $filepath).Length
        
        if ($currentSize -gt $lastSize) {
            $newContent = Get-Content $filepath -Tail 1
            foreach ($line in $newContent) {
                if ($line.Trim()) {
                    Format-LogEntry $line
                }
            }
            $lastSize = $currentSize
        }
    }
}

function Show-RecentErrors {
    $errorFile = Join-Path $LogsDir "error.log"
    
    if (-not (Test-Path $errorFile)) {
        Write-Host "Error log file not found" -ForegroundColor Red
        return
    }
    
    Write-Host "=== Recent Errors ===" -ForegroundColor Red
    Write-Host ""
    
    $content = Get-Content $errorFile -Tail 20
    
    foreach ($line in $content) {
        if ($line.Trim()) {
            Format-LogEntry $line
        }
    }
}

# Main execution
switch ($Command.ToLower()) {
    "list" {
        List-LogFiles
    }
    "tail" {
        if (-not $LogFile) {
            Write-Host "Please specify a log file name" -ForegroundColor Red
            List-LogFiles
            return
        }
        Show-LogTail $LogFile $Lines
    }
    "watch" {
        if (-not $LogFile) {
            Write-Host "Please specify a log file name" -ForegroundColor Red
            List-LogFiles
            return
        }
        Watch-LogFile $LogFile
    }
    "errors" {
        Show-RecentErrors
    }
    default {
        Show-Help
    }
}