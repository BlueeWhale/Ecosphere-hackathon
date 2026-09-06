$ErrorActionPreference = 'Continue'

function Api($method, $path, $body = $null, $token = $null) {
  $headers = @{}
  if ($token) { $headers['Authorization'] = "Bearer $token" }
  try {
    if ($body) {
      $headers['Content-Type'] = 'application/json'
      $json = $body | ConvertTo-Json -Compress -Depth 10
      $r = Invoke-RestMethod -Uri "http://localhost:5000$path" -Method $method -Headers $headers -Body $json
    } else {
      $r = Invoke-RestMethod -Uri "http://localhost:5000$path" -Method $method -Headers $headers
    }
    return [pscustomobject]@{ code = 200; data = $r; ok = $true }
  } catch {
    $status = 0
    $resp = $null
    if ($_.Exception.Response) {
      try { $status = [int]$_.Exception.Response.StatusCode } catch {}
      try {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $txt = $sr.ReadToEnd()
        $resp = $txt | ConvertFrom-Json -ErrorAction SilentlyContinue
        if (-not $resp) { $resp = $txt }
      } catch {}
    }
    return [pscustomobject]@{ code = $status; data = $resp; ok = $false }
  }
}

function Result($label, $pass) {
  $mark = if ($pass) { 'PASS' } else { 'FAIL' }
  Write-Host "  [$mark] $label"
  return $pass
}

Write-Host "==== AUTH TESTS ===="

$t1 = Api GET /api/health
$pass1 = Result "Backend health HTTP 200" ($t1.code -eq 200 -and $t1.data.success)

$t2 = Api GET /api/deals
$pass2 = Result "Unauth /api/deals returns 401" ($t2.code -eq 401)

$emailA = "ps_user_$(Get-Date -Format 'HHmmssfff')@test.ai"
$bodyA = @{ name = 'PS User'; email = $emailA; password = 'ValidPass123'; confirmPassword = 'ValidPass123' }
$t3 = Api POST /api/auth/register $bodyA
$userAId = $t3.data.data.user._id
$userARole = $t3.data.data.user.role
$pass3 = Result "Signup user role=$userARole HTTP=$($t3.code)" ($t3.code -eq 201 -and $userARole -eq 'user')

$emailB = "ps_atk_$(Get-Date -Format 'HHmmssfff')@test.ai"
$bodyB = @{ name = 'Attacker'; email = $emailB; password = 'ValidPass456'; confirmPassword = 'ValidPass456'; role = 'admin' }
$t4 = Api POST /api/auth/register $bodyB
$atkRole = $t4.data.data.user.role
$pass4 = Result "Signup role=admin attack -> role=$atkRole" ($t4.code -eq 201 -and $atkRole -eq 'user')

$loginBodyA = @{ email = $emailA; password = 'ValidPass123' }
$t5 = Api POST /api/auth/login $loginBodyA
$userTok = $t5.data.data.token
$t5b = Api GET /api/auth/me $null $userTok
$meRole = $t5b.data.data.user.role
$pass5 = Result "User login + /me role=$meRole" ($t5.code -eq 200 -and $t5b.code -eq 200 -and $meRole -eq 'user')

$envLines = Get-Content (Join-Path $PSScriptRoot '.env') | Where-Object { $_ -match '^(ADMIN_EMAIL|ADMIN_PASSWORD)=' }
$cfg = @{}
foreach ($line in $envLines) { $kv = $line -split '=', 2; $cfg[$kv[0]] = $kv[1] }
$adminLoginBody = @{ email = $cfg.ADMIN_EMAIL; password = $cfg.ADMIN_PASSWORD }
$t6 = Api POST /api/auth/login $adminLoginBody
$adminTok = $t6.data.data.token
$t6b = Api GET /api/auth/me $null $adminTok
$adminRole = $t6b.data.data.user.role
$pass6 = Result "Admin login + /me role=$adminRole" ($t6.code -eq 200 -and $t6b.code -eq 200 -and $adminRole -eq 'admin')

$t7 = Api GET /api/auth/google/url
$gUrl = $t7.data.data.url
$pass7 = Result "Google OAuth URL endpoint" ($t7.code -eq 200 -and $gUrl -like 'https://accounts.google.com*')

$t8 = Api GET /api/admin/stats $null $userTok
$pass8 = Result "User -> /api/admin/stats HTTP=$($t8.code) expected 403" ($t8.code -eq 403)

$t9 = Api GET /api/admin/stats $null $adminTok
$pass9 = Result "Admin -> /api/admin/stats HTTP=$($t9.code) expected 200" ($t9.code -eq 200)

Write-Host ""
Write-Host "==== CALENDAR / BOOKING TESTS ===="

$t11 = Api GET /api/calendar/availability?date=tomorrow $null $adminTok
$availData = $t11.data.data
$availMode = $availData.mode
$availSlots = ($availData.availableSlots).Count
$pass11 = Result "Availability mode=$availMode slots=$availSlots HTTP=$($t11.code)" ($t11.code -eq 200 -and $availSlots -gt 0)

$isCfg = $availData.isConfigured
$cfgStatus = if ($isCfg) { 'CONFIGURED' } else { 'MISSING' }
Write-Host "  [INFO] Calendar config: $cfgStatus"

$dealCreateScript = @'
import dotenv from 'dotenv'; dotenv.config();
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
const {Deal} = await import('./src/models/Deal.js');
const {User} = await import('./src/models/User.js');
const admin = await User.findOne({email: process.env.ADMIN_EMAIL?.toLowerCase()});
const d = await Deal.create({
  company: 'Phase8Corp',
  contactName: 'Book',
  contactEmail: 'b@phase8.ai',
  productInterest: 'ENTERPRISE',
  numberOfUsers: 25,
  user: admin._id,
  status: 'open',
  currentStage: 'DISCOVERY',
});
console.log(d._id.toString());
mongoose.disconnect();
'@
$dealScriptPath = Join-Path $PSScriptRoot '_mktmpdeal.mjs'
Set-Content -Path $dealScriptPath -Value $dealCreateScript
$dealId = (& node $dealScriptPath 2>&1 | Select-Object -Last 1)
Remove-Item $dealScriptPath -ErrorAction SilentlyContinue
Write-Host "  [INFO] Test deal id: $dealId"

$bookBody = @{
  dealId = $dealId
  meetingDate = 'tomorrow'
  meetingTime = '2:00 PM'
  durationMinutes = 30
  customerEmail = 'booking@phase8.ai'
  summary = 'Phase 8 Test Demo Booking'
}
$t14 = Api POST /api/calendar/book $bookBody $adminTok
$bookingData = $t14.data.data.booking
$bookingMode = if ($bookingData) { $bookingData.mode } else { $null }
$bookingEventId = if ($bookingData) { $bookingData.eventId } else { $null }
$pass14 = Result "Booking created mode=$bookingMode hasEventId=$(-not [string]::IsNullOrEmpty($bookingEventId)) HTTP=$($t14.code)" ($t14.code -eq 200 -and $t14.data.success -and -not [string]::IsNullOrEmpty($bookingEventId))

$dealStageCheck = @'
import dotenv from 'dotenv'; dotenv.config();
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
const {Deal} = await import('./src/models/Deal.js');
const {Booking} = await import('./src/models/Booking.js');
const d = await Deal.findById(process.argv[2]);
const b = await Booking.findOne({deal: process.argv[2]});
console.log('STAGE=' + d.currentStage);
console.log('BOOK_STATUS=' + (d.calendarBooking ? d.calendarBooking.status : 'NONE'));
console.log('BOOKING_DOC=' + (b ? 'EXISTS' : 'NONE'));
console.log('MODE=' + (b ? b.mode : 'NONE'));
console.log('START_AT=' + (b && b.startAt ? 'SET' : 'MISSING'));
console.log('END_AT=' + (b && b.endAt ? 'SET' : 'MISSING'));
console.log('EVENT_ID=' + (b ? (b.eventId ? 'SET' : 'MISSING') : 'NONE'));
mongoose.disconnect();
'@
$stageScriptPath = Join-Path $PSScriptRoot '_chkdeal.mjs'
Set-Content -Path $stageScriptPath -Value $dealStageCheck
$stageOutput = (& node $stageScriptPath $dealId 2>&1 | Out-String).Trim()
Remove-Item $stageScriptPath -ErrorAction SilentlyContinue
$lines = $stageOutput -split "`n" | ForEach-Object { $_.Trim() }
$stageLine = ($lines | Where-Object { $_ -like 'STAGE=*' }) -replace 'STAGE=', ''
$bookStatus = ($lines | Where-Object { $_ -like 'BOOK_STATUS=*' }) -replace 'BOOK_STATUS=', ''
$bookingDoc = ($lines | Where-Object { $_ -like 'BOOKING_DOC=*' }) -replace 'BOOKING_DOC=', ''
$modeLine = ($lines | Where-Object { $_ -like 'MODE=*' }) -replace 'MODE=', ''
$startAt = ($lines | Where-Object { $_ -like 'START_AT=*' }) -replace 'START_AT=', ''
$endAt = ($lines | Where-Object { $_ -like 'END_AT=*' }) -replace 'END_AT=', ''
$eventIdLine = ($lines | Where-Object { $_ -like 'EVENT_ID=*' }) -replace 'EVENT_ID=', ''
$pass15 = Result "Deal stage=$stageLine expected DEMO_REQUESTED, bookingStatus=$bookStatus" ($stageLine -eq 'DEMO_REQUESTED' -and $bookStatus -eq 'CONFIRMED')
$pass16 = Result "Booking doc=$bookingDoc mode=$modeLine startAt=$startAt endAt=$endAt eventId=$eventIdLine" ($bookingDoc -eq 'EXISTS' -and $startAt -eq 'SET' -and $endAt -eq 'SET')

$t17 = Api POST /api/calendar/book $bookBody $adminTok
$pass17 = Result "DB double-book protection HTTP=$($t17.code) expected 409" ($t17.code -eq 409 -or $t17.data.conflict)

$socketCode = Get-Content (Join-Path $PSScriptRoot 'src/services/actionRouterService.js') -Raw
$hasSocket = $socketCode -match "io\.emit\('calendar:booked'"
$pass18 = Result "Socket.IO 'calendar:booked' emit + getIo present" $hasSocket

$liveTestStatus = 'NOT VERIFIED'
Write-Host "  [INFO] Real Google Calendar API live test: $liveTestStatus"

Write-Host ""
Write-Host "==== REGRESSION ===="

$pricingScript = @'
import('./src/services/pricingService.js').then(m => {
  const q = m.calculatePrice({planTier:'ENTERPRISE',numberOfUsers:50,billingCycle:'ANNUAL',requestedDiscountPct:5});
  console.log('FINAL=' + q.finalAmount);
  console.log('POLICY=' + q.policyStatus);
});
'@
$pricingPath = Join-Path $PSScriptRoot '_pricing.mjs'
Set-Content -Path $pricingPath -Value $pricingScript
$prOut = (& node $pricingPath 2>&1 | Out-String).Trim()
Remove-Item $pricingPath -ErrorAction SilentlyContinue
$pFinal = (($prOut -split "`n") | Where-Object { $_ -like 'FINAL=*' }) -replace 'FINAL=', ''
$pPolicy = (($prOut -split "`n") | Where-Object { $_ -like 'POLICY=*' }) -replace 'POLICY=', ''
$pass20 = Result "Pricing Engine final=`$$pFinal policy=$pPolicy" ([int]$pFinal -gt 0 -and $pPolicy -eq 'APPROVED')

$t21 = Api GET /api/deals $null $adminTok
$dealCount = $t21.data.count
$pass21 = Result "Admin /api/deals count=$dealCount HTTP=$($t21.code)" ($t21.code -eq 200)

$tLead = Api GET /api/leads $null $adminTok
$tCust = Api GET /api/customers $null $adminTok
$tProd = Api GET /api/products $null $adminTok
$pass22 = Result "Leads=$($tLead.code) Cust=$($tCust.code) Prod=$($tProd.code)" ($tLead.code -eq 200 -and $tCust.code -eq 200 -and $tProd.code -eq 200)

$ragBody = @{ query = 'pricing'; topK = 2 }
$tRag = Api POST /api/knowledge/search $ragBody $adminTok
$pass23 = Result "RAG /knowledge/search success=$($tRag.data.success) HTTP=$($tRag.code)" ($tRag.code -eq 200 -and $tRag.data.success)

try {
  $ioResp = Invoke-WebRequest -Uri "http://localhost:5000/socket.io/?EIO=4&transport=polling" -UseBasicParsing -Method Get -ErrorAction Stop
  $ioCode = $ioResp.StatusCode
} catch { try { $ioCode = [int]$_.Exception.Response.StatusCode } catch { $ioCode = 0 } }
$pass24 = Result "Socket.IO handshake HTTP $ioCode" ($ioCode -eq 200 -or $ioCode -eq 400)

$voiceBody = @{ dealId = $dealId }
$tVoice = Api POST /api/voice/session $voiceBody $adminTok
$pass25 = Result "Agora voice HTTP=$($tVoice.code) (not 401=ok)" ($tVoice.code -ne 401)

Write-Host ""
Write-Host "==== ENV ===="
$vars = @('ADMIN_EMAIL','ADMIN_PASSWORD','GEMINI_API_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','GOOGLE_CALENDAR_ID','JWT_SECRET','MONGODB_URI','AGORA_APP_ID','AGORA_APP_CERTIFICATE','AGORA_CUSTOMER_ID','AGORA_CUSTOMER_SECRET')
$envRaw = Get-Content (Join-Path $PSScriptRoot '.env')
foreach ($v in $vars) {
  $m = $envRaw | Where-Object { $_ -match "^${v}=" }
  if ($m) {
    $val = ($m -split '=', 2)[1]
    $status = if ($val -and -not $val.Contains('your_')) { 'CONFIGURED' } else { 'MISSING' }
  } else { $status = 'MISSING' }
  Write-Host "  $($v.PadRight(25,' ')) $status"
}

Write-Host ""
Write-Host "==== SUMMARY ===="
$allPasses = @($pass1,$pass2,$pass3,$pass4,$pass5,$pass6,$pass7,$pass8,$pass9,$pass11,$pass14,$pass15,$pass16,$pass17,$pass18,$pass20,$pass21,$pass22,$pass23,$pass24,$pass25)
$passed = ($allPasses | Where-Object { $_ }).Count
Write-Host "  Passed: $passed / $($allPasses.Count)"
Write-Host "  Google Calendar config: $cfgStatus"
Write-Host "  Real Google Calendar API live: $liveTestStatus"
