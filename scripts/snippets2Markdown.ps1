[CmdletBinding()]
param (
    [Parameter(Mandatory)]
    [ValidateScript({ Test-Path -Path $_ -PathType Leaf })]
    [string]
    $fileName
)

$snippets = gc .\snippets\transforms.json | ConvertFrom-Json


Write-Output "| Trigger | Content |`n| --- | --- |"

$snippets | gm -MemberType NoteProperty | ForEach-Object {
    $snippetName = $_.name
    $prefix = $snippets.$snippetName.prefix

    Write-Output "| ``$prefix`` | $snippetName |"
}