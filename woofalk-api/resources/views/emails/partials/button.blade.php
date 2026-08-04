{{-- Expects $url and $label --}}
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{ $url }}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="50%" fillcolor="#A65E2C" stroke="f">
<center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">{{ $label }}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
  <td bgcolor="#A65E2C" style="border-radius:999px;">
    <a href="{{ $url }}" style="display:block; padding:14px 30px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;">{{ $label }}</a>
  </td>
</tr></table>
<!--<![endif]-->
