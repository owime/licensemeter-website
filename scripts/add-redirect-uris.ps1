<#
.SYNOPSIS
  Appends a deployment's redirect URIs to both LicenseMeter app registrations.

.EXAMPLE
  ./add-redirect-uris.ps1 -BaseUrl "https://licenses.example.com" -SignInAppId "<your-sign-in-app-id>" -ConnectorAppId "<your-connector-app-id>"

.NOTES
  Run as a user who can manage the applications in the product tenant.
  Existing redirect URIs (e.g. localhost) are preserved.
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [Parameter(Mandatory = $true)]
  [guid]$SignInAppId,
  [Parameter(Mandatory = $true)]
  [guid]$ConnectorAppId
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

Import-Module Microsoft.Graph.Applications -ErrorAction Stop
Connect-MgGraph -Scopes "Application.ReadWrite.All" -NoWelcome

function Add-RedirectUri {
  param([string]$AppId, [string]$Uri)
  $app = Get-MgApplication -Filter "appId eq '$AppId'"
  if (-not $app) { throw "Application $AppId not found in this tenant." }
  $uris = @($app.Web.RedirectUris)
  if ($uris -contains $Uri) {
    Write-Host "$($app.DisplayName): $Uri already present" -ForegroundColor Yellow
    return
  }
  Update-MgApplication -ApplicationId $app.Id -Web @{ RedirectUris = ($uris + $Uri) }
  Write-Host "$($app.DisplayName): added $Uri" -ForegroundColor Green
}

Add-RedirectUri -AppId $SignInAppId -Uri "$BaseUrl/api/auth/callback/microsoft-entra-id"
Add-RedirectUri -AppId $ConnectorAppId -Uri "$BaseUrl/api/connect/callback"

Write-Host "Done. Production sign-in and consent are now permitted for $BaseUrl." -ForegroundColor Green
