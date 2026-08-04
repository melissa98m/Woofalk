@extends('emails.layouts.base')

@section('title', 'Réinitialisez votre mot de passe')
@section('preheader', 'Un lien pour choisir un nouveau mot de passe.')
@section('banner_bg', '#F4E3CD')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Réinitialisez votre mot de passe</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Vous avez demandé à réinitialiser le mot de passe de votre compte Woofalk. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
</td></tr>

<tr><td style="padding:0 32px 28px;" align="center">
  @include('emails.partials.button', ['url' => $url, 'label' => 'Choisir un nouveau mot de passe'])
</td></tr>

<tr><td style="padding:0 32px 32px;">
  <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B6153;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre mot de passe restera inchangé.</p>
</td></tr>
@endsection

@section('footer_extra')
  <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#6B6153;">Besoin d'aide ? <a href="mailto:bonjour@woofalk.com" style="color:#4F6B47; text-decoration-line:underline;">bonjour@woofalk.com</a></p>
@endsection
