# Song Manager — Setup (bilkul free, credit card ke baghair)

Yeh app har wedding invitation ke liye **ek active background song** manage karti hai.

| Cheez | Kahan hai | Card chahiye? |
| --- | --- | --- |
| Login (Email/Password) | Firebase Authentication | Nahi |
| Song ki list / role (admin) | Firebase Firestore | Nahi |
| Audio file (mp3) | **Cloudinary** | Nahi |

> Firebase ne Storage ko Spark (free) plan se hata diya hai (ab Blaze + card chahiye), is liye
> audio files Cloudinary par jati hain. Firebase Storage ko **enable mat karein**.

Song replace karne par **purana song Cloudinary se bhi delete ho jata hai**, is liye storage kabhi
zyada use nahi hoti (har invitation ka sirf ek song rehta hai).

---

## Part A — Firebase (Auth + Firestore)

1. https://console.firebase.google.com par naya project banayein (Spark plan, default).
2. Project overview → **Add app → Web (`</>`)** → register karein.
3. `firebaseConfig` dikhega. `.env.example` ko copy karke `.env` banayein aur yeh values bharein:

| firebaseConfig | .env variable |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

4. **Authentication → Sign-in method → Email/Password → Enable.**
5. **Firestore Database → Create database** (production mode theek hai).
6. **Firestore → Rules** mein `firestore.rules` ka poora content paste karke **Publish** karein.
   ⚠️ Yeh step zaroori hai. Rules publish na hon to `users` document nahi ban sakta aur
   role/upload kaam nahi karega.

## Part B — Cloudinary (free audio storage)

1. https://cloudinary.com par free account banayein (Google se bhi ho jata hai). Card nahi maanga jata.
2. Dashboard par **Cloud name** copy karein → `.env` mein `VITE_CLOUDINARY_CLOUD_NAME`.
3. **Settings → Upload → Upload presets → Add upload preset**:
   - **Signing mode: Unsigned**
   - Preset name likhein (e.g. `wedding_songs`) → `.env` mein `VITE_CLOUDINARY_UPLOAD_PRESET`
   - **Allowed formats** mein sirf: `mp3,wav,m4a,ogg`
   - "Use filename as public ID" / "Disallow public ID" ko **on mat karein**
   - Save.
4. **Settings → API Keys** (ya Dashboard → "API Keys") se **API Key** aur **API Secret** copy karein:
   ```
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
   ⚠️ In dono ke naam mein **`VITE_` mat lagayein**. Yeh sirf server use karta hai (purana song
   delete karne ke liye). `VITE_` lagane se secret browser mein leak ho jayega.
   API Secret kisi ko mat dikhayein, GitHub par mat daalein (`.env` already git-ignored hai).

Aapki final `.env` aisi dikhni chahiye:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
`.env` badalne ke baad dev server **restart** karein.

**Deploy karte waqt:** jahan app host karti hain (Lovable / Cloudflare / Vercel / Netlify...) wahan ke
dashboard mein yehi saari variables Environment Variables / Secrets mein add karein. Khaas taur par
`CLOUDINARY_API_KEY` aur `CLOUDINARY_API_SECRET` — inke baghair upload chalega, lekin purani file
delete nahi hogi (app aapko warning dikha degi).

## Part C — Pehla account aur admin banana

1. App kholein → **Create an account** → signup karein.
2. App khud `users/{uid}` document banati hai (`role: "user"`). Yeh **har login par bhi check hota hai**:
   agar kisi wajah se document nahi bana tha to login par ban jata hai.
3. Firebase Console → **Firestore → `users` → apna document** (document ID = aapka UID; dashboard par
   bhi UID likha hota hai) → `role` ko `user` se **`admin`** kar dein.
4. App mein **"I changed the role — check again"** button dabayein (ya logout/login). Ab upload ka
   section nazar aayega.

Role badalne ka koi UI jaan boojh kar nahi hai, warna koi bhi khud ko admin bana leta.

## Part D — Song upload karna

1. Invitation select karein → mp3/wav/m4a/ogg choose karein (max 15 MB) → **Upload Song**.
2. Us invitation par pehle se song ho to app confirm poochegi. **Replace** karne par:
   - naya song pehle upload hota hai aur Firestore mein save hota hai,
   - phir purana song **Cloudinary se aur Firestore se delete** ho jata hai.
   (Naya upload fail ho jaye to purana song safe rehta hai.)
3. **Delete** button song ko Cloudinary aur Firestore dono se hata deta hai.

---

## Part E — Song ka sirf ek hissa (clip) chalana

Poora gaana upload karein, aur batayein ke kaun sa hissa chalana hai (jaise chorus ka 0:30 se 1:00).

1. Invitation select karein → gaana choose karein.
2. Neeche **"Play only part of the song"** box aayega. Wahan gaana chalayein, jahan se hissa shuru karna ho wahan
   pause karke **Set start here** dabayein, aur jahan khatam karna ho wahan **Set end here** dabayein.
   Ya time khud likh dein (`75` ya `1:15`). Dono khali chhodne par poora gaana chalega.
3. **▶ Preview clip** se sun lein ke sahi hissa hai.
4. **Upload Song** dabayein.

Baad mein hissa badalna ho to dobara upload ki zaroorat nahi: **Current Song → Edit clip** → naye times → **Save clip**.

Yeh kaise kaam karta hai: poori file Cloudinary mein rehti hai, aur invitation ko ek aisa link milta hai jo Cloudinary
ke andar trimming ke saath chalta hai (`so_30,eo_60`). Invitation websites mein koi change nahi chahiye, woh pehle ki
tarah `audioUrl` hi padhti hain.

Agar clip wala song chalne par error aaye ya poora gaana hi chale, to Cloudinary → Settings → Security mein
**"Strict transformations"** check karein. Agar woh on hai to link wali trimming block ho jati hai; usay off karein.

---

## Agar "Firestore mein data nahi aa raha" / role change nahi ho pa raha

| Nishani | Wajah | Hal |
| --- | --- | --- |
| Dashboard par laal message "Could not load your profile from Firestore (You don't have permission...)" | Firestore rules publish nahi hue | Part A step 6 |
| Message mein "database (default) does not exist" / koi network error | Firestore database create nahi hua | Part A step 5 |
| `users` collection hi nahi dikhti | Upar wale 2 masle mein se koi | Theek karke dobara login/refresh karein, document khud ban jayega |
| Console mein `users` ke documents hain lekin role badalne ke baad bhi user hi dikhta hai | App ne purana role cache kiya | "check again" button ya logout/login |
| Galat project mein dekh rahi hain | `.env` ka `VITE_FIREBASE_PROJECT_ID` aur console ka project alag | Dono match karein |

## Upload / delete ke masail

| Masla | Hal |
| --- | --- |
| "Cloudinary is not configured" | `.env` mein `VITE_CLOUDINARY_*` bharein, server restart |
| Upload par "Upload preset not found" / "must be whitelisted" | Preset ka naam ghalat, ya Signing mode **Unsigned** nahi hai |
| Upload par "format not allowed" | Preset ke Allowed formats mein file ka format add karein |
| Upload ho gaya lekin "previous file could not be removed" | `CLOUDINARY_API_KEY`/`SECRET` server par set nahi, ya galat hain. Theek karne ke baad agla upload purani file bhi saaf kar dega |

---

## Data structure

```
users/{uid}    -> email, role ("user" | "admin"), createdAt
songs/{songId} -> invitationId, invitationName, fileName,
                  audioUrl (jo invitation chalati hai: trimmed ho sakta hai),
                  originalUrl (poora gaana), startOffset, endOffset (seconds, null = poora),
                  storagePath (Cloudinary public_id), uploadedBy, createdAt
```
Cloudinary par files `wedding-songs/{invitationId}/...` mein hoti hain.

## Nayi invitation add karna

`src/config/invitations.js` mein `{ id, name }` add karein. Aur kuch nahi badalna.

---

## Invitation website mein song chalana

1. Wahan `npm install firebase` karein.
2. `src/lib/firebase.js` aur uske env variables copy karein (sirf `VITE_FIREBASE_*`;
   Cloudinary ki kisi cheez ki zaroorat nahi, kyunke `audioUrl` seedha chalne wala link hai).
3. Yeh helper copy karein:

```js
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function getInvitationSong(invitationId) {
  const snap = await getDocs(
    query(
      collection(db, "songs"),
      where("invitationId", "==", invitationId),
      orderBy("createdAt", "desc"),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return { audioUrl: data.audioUrl, fileName: data.fileName, invitationId: data.invitationId };
}
```

4. Use karein (URL kabhi hardcode na karein):

```js
const song = await getInvitationSong("90s-dholki");
if (song) {
  audioElement.src = song.audioUrl;
  // Browser autoplay block karta hai — play sirf user ke click ke baad karein.
  openButton.addEventListener("click", () => audioElement.play());
}
```

Dashboard mein song badalne se invitation par song khud badal jata hai, code change nahi chahiye.

## Firestore index

Song query `invitationId` filter karti hai aur `createdAt` se sort. Pehli baar browser console mein
ek link aa sakta hai ("The query requires an index") — us par click karke index bana lein.

## Security ka note

- `firestore.rules` hi asal access control hai: sirf `role == "admin"` songs likh/delete sakta hai,
  aur koi apna role khud nahi badal sakta.
- Cloudinary ka **unsigned preset** browser mein nazar aata hai, yani jo uska naam jaan le woh audio
  upload kar sakta hai. Isi liye preset mein sirf audio formats rakhein. Delete sirf server function se
  hota hai jo pehle check karti hai ke request karne wala Firestore mein admin hai.