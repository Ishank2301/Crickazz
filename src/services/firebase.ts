import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (Required)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline or connecting...');
    }
  }
}

// Trigger initial connection test
testConnection();

// Authentication Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      // Upsert user profile
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(
          userDocRef,
          {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Cricket Analyst',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not upsert user profile:', err);
      }
    }
    return user;
  } catch (error) {
    console.error('Sign-in failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Saved Queries Persistence
export interface UserSavedQuery {
  id?: string;
  userId: string;
  title: string;
  sql: string;
  difficulty?: string;
  description?: string;
  createdAt: string;
}

export async function saveUserQuery(queryData: Omit<UserSavedQuery, 'id' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = `users/${auth.currentUser.uid}/saved_queries`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...queryData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserSavedQueries(userId: string): Promise<UserSavedQuery[]> {
  const path = `users/${userId}/saved_queries`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<UserSavedQuery, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteUserSavedQuery(userId: string, queryId: string): Promise<void> {
  const path = `users/${userId}/saved_queries/${queryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'saved_queries', queryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Match Notes Persistence
export interface UserMatchNote {
  id?: string;
  userId: string;
  matchId: string;
  note: string;
  playerMention?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function saveMatchNote(noteData: Omit<UserMatchNote, 'id' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = `users/${auth.currentUser.uid}/match_notes`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...noteData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserMatchNotes(userId: string): Promise<UserMatchNote[]> {
  const path = `users/${userId}/match_notes`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<UserMatchNote, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteMatchNote(userId: string, noteId: string): Promise<void> {
  const path = `users/${userId}/match_notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'match_notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Favorite Players Persistence
export interface FavoritePlayerRecord {
  id?: string;
  userId: string;
  playerId: string;
  playerName: string;
  team?: string;
  role?: string;
  addedAt: string;
}

export async function addFavoritePlayer(player: { playerId: string; playerName: string; team?: string; role?: string }): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const path = `users/${auth.currentUser.uid}/favorite_players`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...player,
      userId: auth.currentUser.uid,
      addedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserFavoritePlayers(userId: string): Promise<FavoritePlayerRecord[]> {
  const path = `users/${userId}/favorite_players`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FavoritePlayerRecord, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function removeFavoritePlayer(userId: string, favoriteId: string): Promise<void> {
  const path = `users/${userId}/favorite_players/${favoriteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorite_players', favoriteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
