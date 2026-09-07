import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseConnectionStatus, FirebaseCredentials } from '../types';
import { storageService } from './storage';

const STORAGE_KEY_CREDS = 'yfl_firebase_credentials';
const STORAGE_KEY_LAST_SYNC = 'yfl_firebase_last_sync';

// Default / fallback Firebase credentials for Yajur Fibres Limited
export const DEFAULT_FIREBASE_CREDENTIALS: FirebaseCredentials = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyYajurFibres-YFL-TaskMS-Cloud2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'yfl-taskms-lotus.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'yfl-taskms-lotus',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'yfl-taskms-lotus.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '28917971364',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:28917971364:web:8c9d0e1f2a3b4c5d6e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YFLTASKMS26',
};

// Retrieve currently active credentials
export function getActiveFirebaseCredentials(): FirebaseCredentials {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CREDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId) {
        return {
          ...DEFAULT_FIREBASE_CREDENTIALS,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('Could not read saved Firebase credentials:', err);
  }
  return DEFAULT_FIREBASE_CREDENTIALS;
}

// Persist user-provided credentials
export function saveFirebaseCredentials(credentials: FirebaseCredentials): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(credentials));
    // Reset app instance so it re-initializes on next request
    cachedApp = null;
    cachedDb = null;
  } catch (err) {
    console.error('Failed to save Firebase credentials:', err);
  }
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

// Lazy initialization of Firebase App
export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  const creds = getActiveFirebaseCredentials();
  const existingApps = getApps();

  if (existingApps.length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  cachedApp = initializeApp(creds);
  return cachedApp;
}

// Lazy initialization of Firestore
export function getFirestoreDb(): Firestore | null {
  try {
    if (cachedDb) return cachedDb;
    const app = getFirebaseApp();
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.warn('Firebase Firestore initialization notice (running local cache):', err);
    return null;
  }
}

// Check Firebase connection status
export async function testFirebaseConnection(customCreds?: FirebaseCredentials): Promise<{
  success: boolean;
  message: string;
  projectId: string;
}> {
  if (customCreds) {
    saveFirebaseCredentials(customCreds);
  }
  const creds = customCreds || getActiveFirebaseCredentials();
  try {
    const db = getFirestoreDb();
    if (!db) {
      return {
        success: false,
        message: 'Could not initialize Firestore client. Check your Firebase credentials.',
        projectId: creds.projectId,
      };
    }

    // Try a ping write to a system health check doc in Firestore
    const pingRef = doc(db, '_yfl_system', 'connectivity_test');
    await setDoc(pingRef, {
      lastTest: new Date().toISOString(),
      clientTime: Date.now(),
      status: 'operational',
      app: 'YFL Lotus TaskMS',
    });

    return {
      success: true,
      message: `Successfully connected to Firebase Firestore project "${creds.projectId}".`,
      projectId: creds.projectId,
    };
  } catch (error: any) {
    // If it's a network error or permissions error, provide clear diagnostics
    const msg = error?.message || 'Network or authorization error connecting to Firestore.';
    return {
      success: false,
      message: `Firebase connection test failed: ${msg}`,
      projectId: creds.projectId,
    };
  }
}

// Push all local factory data to Firestore
export async function pushAllDataToFirestore(customData?: {
  taskMasters?: any[];
  scheduledTasks?: any[];
  departments?: any[];
  users?: any[];
  checklistTemplates?: any[];
  settings?: any;
  auditLogs?: any[];
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Firestore database instance is not available.');
    }

    const localData = storageService.loadAllData();
    const data = {
      taskMasters: customData?.taskMasters ?? localData.taskMasters,
      scheduledTasks: customData?.scheduledTasks ?? localData.scheduledTasks,
      departments: customData?.departments ?? localData.departments,
      users: customData?.users ?? localData.users,
      checklistTemplates: customData?.checklistTemplates ?? localData.checklistTemplates,
      settings: customData?.settings ?? localData.settings,
      auditLogs: customData?.auditLogs ?? localData.auditLogs,
    };

    let writeCount = 0;

    // 1. Settings
    if (data.settings) {
      await setDoc(doc(db, 'system_settings', 'active'), {
        ...data.settings,
        updatedAt: new Date().toISOString(),
      });
      writeCount++;
    }

    // 2. Departments
    for (const dept of data.departments) {
      await setDoc(doc(db, 'departments', dept.id), dept);
      writeCount++;
    }

    // 3. Users
    for (const user of data.users) {
      await setDoc(doc(db, 'users', user.id), user);
      writeCount++;
    }

    // 4. Checklist Templates
    for (const chk of data.checklistTemplates) {
      await setDoc(doc(db, 'checklist_templates', chk.id), chk);
      writeCount++;
    }

    // 5. Task Masters (33 machines)
    for (const tm of data.taskMasters) {
      await setDoc(doc(db, 'task_masters', tm.id), tm);
      writeCount++;
    }

    // 6. Scheduled Tasks (batch in chunks of 40)
    const chunkSize = 40;
    for (let i = 0; i < data.scheduledTasks.length; i += chunkSize) {
      const chunk = data.scheduledTasks.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        batch.set(doc(db, 'scheduled_tasks', item.id), item);
        writeCount++;
      }
      await batch.commit();
    }

    // 7. Store sync audit marker
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      message: `Pushed ${writeCount} total records across 6 collections to Firestore successfully!`,
      count: writeCount,
    };
  } catch (err: any) {
    console.error('Firestore push error:', err);
    return {
      success: false,
      message: `Failed to push to Firestore: ${err?.message || err}`,
      count: 0,
    };
  }
}

// Pull all data from Firestore
export async function pullAllDataFromFirestore(saveToLocalStorage = true): Promise<{
  success: boolean;
  data?: {
    taskMasters: any[];
    scheduledTasks: any[];
    departments: any[];
    users: any[];
    checklistTemplates: any[];
    settings?: any;
    auditLogs: any[];
  };
  message: string;
}> {
  try {
    const db = getFirestoreDb();
    if (!db) {
      throw new Error('Firestore is not initialized.');
    }

    const [tasksSnap, schedulesSnap, deptsSnap, usersSnap, chkSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'task_masters')),
      getDocs(collection(db, 'scheduled_tasks')),
      getDocs(collection(db, 'departments')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'checklist_templates')),
      getDoc(doc(db, 'system_settings', 'active')),
    ]);

    const taskMasters = tasksSnap.docs.map((d) => d.data());
    const scheduledTasks = schedulesSnap.docs.map((d) => d.data());
    const departments = deptsSnap.docs.map((d) => d.data());
    const users = usersSnap.docs.map((d) => d.data());
    const checklistTemplates = chkSnap.docs.map((d) => d.data());
    const settings = settingsSnap.exists() ? settingsSnap.data() : undefined;

    const pulledData = {
      taskMasters,
      scheduledTasks,
      departments,
      users,
      checklistTemplates,
      settings,
      auditLogs: [],
    };

    if (saveToLocalStorage && (taskMasters.length > 0 || scheduledTasks.length > 0)) {
      const existing = storageService.loadAllData();
      storageService.saveAllData({
        ...existing,
        taskMasters: taskMasters.length > 0 ? (taskMasters as any) : existing.taskMasters,
        scheduledTasks: scheduledTasks.length > 0 ? (scheduledTasks as any) : existing.scheduledTasks,
        departments: departments.length > 0 ? (departments as any) : existing.departments,
        users: users.length > 0 ? (users as any) : existing.users,
        checklistTemplates: checklistTemplates.length > 0 ? (checklistTemplates as any) : existing.checklistTemplates,
        settings: (settings as any) || existing.settings,
      });
    }

    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      data: pulledData,
      message: `Successfully retrieved ${scheduledTasks.length} scheduled tasks and ${taskMasters.length} machine task masters from Firestore.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to pull from Firestore: ${err?.message || err}`,
    };
  }
}

// Sync single document changes to Firestore in real-time
export async function syncDocToFirestore(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const db = getFirestoreDb();
    if (!db) return;
    await setDoc(doc(db, collectionName, docId), data, { merge: true });
  } catch (err) {
    // Non-blocking background sync warning
    console.warn(`Firestore sync error for ${collectionName}/${docId}:`, err);
  }
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
}
