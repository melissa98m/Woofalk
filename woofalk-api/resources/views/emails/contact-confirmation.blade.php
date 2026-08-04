@extends('emails.layouts.base')

@section('title', 'Votre message a bien été reçu')
@section('preheader', 'Merci de nous avoir écrit — on revient vers vous sous 48h.')
@section('banner_bg', '#E1EBDA')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Merci, votre message est bien arrivé</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Nous avons bien reçu votre message concernant « {{ $subject }} ». Notre équipe vous répond généralement sous 48h.</p>
</td></tr>

<tr><td style="padding:0 32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6; border-radius:16px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Récapitulatif de votre message</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#362E24; font-style:italic;">« {{ $contenu }} »</p>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:0 32px 32px;" align="center">
  @include('emails.partials.button', ['url' => 'https://woofalk.com', 'label' => 'Retour au site'])
</td></tr>
@endsection
