# Configuration OAuth (Supabase + Google)

Ce document décrit les étapes pour activer l'authentification OAuth via Supabase et configurer le fournisseur Google.

## 1) Pré-requis

- Un projet Supabase (identifiant / URL visible dans le dashboard)
- Les identifiants (Client ID / Client Secret) fournis par chaque fournisseur
- Dans votre application, définissez les variables d'environnement (voir `.env.example`)

## 2) Variables d'environnement

Placez dans votre `.env` (local) :

```bash
NUXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_BASE_URL=http://localhost:3000
```

Redémarrez le serveur dev après modification.

## 3) Configuration côté Supabase

1. Ouvrez votre projet Supabase → `Authentication` → `Providers`.
2. Activez Google et collez le `Client ID` et `Client Secret` obtenus lors de la création de l'application côté Google.
3. Supabase vous demandera un redirect URI lors de la configuration côté fournisseur : utilisez

```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

(Remplacez `<your-supabase-project>` par l'hôte fourni par Supabase — visible dans `Settings`).

4. Dans `Settings` → `Site URL`, mettez l'URL où votre application tourne (ex. `http://localhost:3000` en dev).

## 4) Google — créer des identifiants

1. Allez sur Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Type: `Web application`.
3. Authorized redirect URIs: ajoutez

```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

4. Récupérez le `Client ID` et `Client Secret`, collez-les dans Supabase (Providers → Google).

<!-- LinkedIn and Apple sections removed: this project uses Google only -->

## 7) Côté frontend (ce dépôt)

- Le composable `useAuth()` expose désormais `signInWithProvider(provider)`.
- Le formulaire de connexion (`app/components/auth/Form.vue`) propose désormais uniquement le bouton Google.
- L'appel frontend déclenche `supabase.auth.signInWithOAuth({ provider })` et Supabase gère le flux de redirect.

Notes:

- Lors du développement local, Supabase redirigera vers votre dashboard callback puis vers votre `APP_BASE_URL`. Assurez-vous que `Settings > Site URL` dans Supabase est correctement paramétré.
- Si vous hébergez sur un domaine personnalisé, mettez à jour les redirect URIs côté fournisseurs et dans Supabase.

## 8) Vérification

1. Lancez `npm run dev`.
2. Ouvrez `/auth/login`, cliquez sur un fournisseur.
3. Vous devriez être redirigé vers la page d'autorisation du fournisseur puis revenir vers votre app connecté.

Si vous rencontrez des erreurs, copiez le message d'erreur et je vous aiderai à déboguer.
