<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<title>@yield('title', 'Woofalk')</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0E6;">
<span style="display:none; font-size:1px; color:#F5F0E6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">@yield('preheader', '')</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#FFFDF8; border-radius:20px; overflow:hidden; border:1px solid #DDD2BE;">

<tr><td style="background-color:@yield('banner_bg', '#E1EBDA'); padding:28px 32px; text-align:center;">
  <span style="font-family:Arial, Helvetica, sans-serif; font-weight:bold; font-size:22px; color:#362E24; letter-spacing:0.5px;">&#128062; WOOFALK</span>
</td></tr>

@yield('content')

<tr><td style="padding:24px 32px; border-top:1px solid #DDD2BE; background-color:#FFFDF8;">
  <p style="margin:0 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#6B6153;">Woofalk &mdash; France</p>
  @yield('footer_extra')
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
