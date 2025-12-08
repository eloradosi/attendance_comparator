import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        // Do not throw here to allow the dev server to start; we'll surface error when called.
        console.warn('Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in env.');
    } else {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Accept token from Authorization header or JSON body { token }
    const authHeader = (req.headers.authorization || '') as string;
    const match = authHeader.match(/^Bearer (.+)$/);
    const token = match ? match[1] : (req.body?.token as string | undefined);

    if (!token) {
        return res.status(400).json({ error: 'Missing token. Provide Authorization: Bearer <idToken> or JSON body { token }' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin SDK not initialized. Check server env vars.' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return res.status(200).json({ ok: true, decoded });
    } catch (err: any) {
        console.error('verifyIdToken error:', err);
        return res.status(401).json({ ok: false, error: err?.message || String(err) });
    }
}
