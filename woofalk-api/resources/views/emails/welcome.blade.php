@extends('emails.layouts.base')

@section('title', 'Bienvenue sur Woofalk')
@section('preheader', 'Bienvenue chez Woofalk — votre compte est prêt, direction les balades !')
@section('banner_bg', '#E1EBDA')

@section('content')
<tr><td style="padding:36px 32px 8px;">
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; color:#362E24;">Bienvenue, {{ $username }} !</p>
  <p style="margin:0 0 18px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#362E24;">Votre compte Woofalk est prêt. Vous pouvez dès maintenant trouver des lieux et des balades autorisés aux chiens partout en France, et enregistrer vos favoris.</p>
</td></tr>

<tr><td style="padding:0 32px 28px;" align="center">
  @include('emails.partials.button', ['url' => 'https://woofalk.com/places', 'label' => 'Découvrir la carte'])
</td></tr>

<tr><td style="padding:0 32px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E6; border-radius:16px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; color:#6B6153; text-transform:uppercase; letter-spacing:0.04em;">Pour commencer</p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#362E24;">
        • Explorez les parcs, plages et forêts autour de vous<br>
        • Ajoutez vos lieux préférés en favoris<br>
        • Proposez un lieu ou une balade que vous connaissez
      </p>
    </td></tr>
  </table>
</td></tr>
@endsection

@section('footer_extra')
  <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#6B6153;"><a href="https://woofalk.com/mon-compte" style="color:#4F6B47;">Gérer mes préférences</a> de notification</p>
@endsection
