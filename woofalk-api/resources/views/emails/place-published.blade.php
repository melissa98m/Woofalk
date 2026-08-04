@extends('emails.layouts.base')

@section('title', 'Votre lieu a été publié')
@section('preheader', 'Bonne nouvelle : « ' . $placeName . ' » est en ligne !')
@section('banner_bg', '#FCE1DB')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Votre lieu est en ligne &#127881;</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Merci pour votre contribution ! Le lieu que vous avez proposé a été vérifié et publié sur Woofalk.</p>
</td></tr>

<tr><td style="padding:0 32px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6; border-radius:16px;">
    <tr><td style="padding:20px 24px;">
      @if($categoryName)
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background-color:#E1EBDA; color:#4F6B47; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; padding:5px 12px; border-radius:999px;">{{ mb_strtoupper($categoryName) }}</td>
      </tr></table>
      @endif
      <p style="margin:10px 0 4px; font-family:Arial, Helvetica, sans-serif; font-size:17px; font-weight:bold; color:#362E24;">{{ $placeName }}</p>
      @if($city)
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#6B6153;">{{ $city }}</p>
      @endif
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:0 32px 32px;" align="center">
  @include('emails.partials.button', ['url' => $placeUrl, 'label' => 'Voir la fiche'])
</td></tr>
@endsection

@section('footer_extra')
  <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#6B6153;"><a href="https://woofalk.com/mon-compte" style="color:#4F6B47;">Gérer mes préférences</a> de notification</p>
@endsection
