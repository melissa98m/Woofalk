@extends('emails.layouts.base')

@section('title', 'Nouveau message - Woofalk')
@section('preheader', 'Nouveau message reçu via le formulaire de contact.')
@section('banner_bg', '#E1EBDA')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Nouveau message</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Vous avez reçu un message via le formulaire de contact de la plateforme Woofalk.</p>
</td></tr>

<tr><td style="padding:0 32px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6; border-radius:16px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Nom</p>
      <p style="margin:0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#362E24;">{{ $name }}</p>
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Email</p>
      <p style="margin:0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#362E24;">{{ $email }}</p>
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Sujet</p>
      <p style="margin:0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#362E24;">{{ $subject }}</p>
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Message</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">{{ $contenu }}</p>
    </td></tr>
  </table>
</td></tr>
@endsection
