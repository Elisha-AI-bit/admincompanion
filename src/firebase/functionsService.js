import app from './config'
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions(app)

/**
 * Cloud Functions wrappers related to FCM / remote commands.
 */
export const functionsService = {
  /**
   * Trigger a remote device command via the `sendDeviceCommand` Cloud Function.
   * The Cloud Function is responsible for:
   * - Looking up the target device token(s)
   * - Sending the FCM message
   * - Writing any authoritative logs to Firestore
   */
  sendDeviceCommand: async (payload) => {
    const callable = httpsCallable(functions, 'sendDeviceCommand')
    const result = await callable(payload)
    return result?.data
  }
}

