@extends('emails.layouts.base')

@section('title', 'Réponse à votre message - Woofalk')
@section('preheader', 'L\'équipe Woofalk vous a répondu.')
@section('banner_bg', '#E1EBDA')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Bonjour {{ $name }}</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Voici la réponse de l'équipe Woofalk à votre message{{ $originalSubject ? ' concernant : « '.$originalSubject.' »' : '' }}.</p>
</td></tr>

<tr><td style="padding:0 32px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6; border-radius:16px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">{!! nl2br(e($reply)) !!}</p>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:0 32px 32px;">
  <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Votre message initial</p>
  <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#6B6153; font-style:italic;">{{ $originalMessage }}</p>
</td></tr>
@endsection
