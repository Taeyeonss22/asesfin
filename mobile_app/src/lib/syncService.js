import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = '@pagos_queue';

export const SyncService = {
  // Add a payment to the local queue
  addToQueue: async (pago) => {
    try {
      const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      queue.push(pago);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error('Error adding to queue:', e);
      return false;
    }
  },

  // Get current queue
  getQueue: async () => {
    try {
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (e) {
      console.error('Error getting queue:', e);
      return [];
    }
  },

  // Attempt to sync all pending payments
  syncPending: async () => {
    const queue = await SyncService.getQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    let syncedCount = 0;
    const remainingQueue = [];

    for (const pago of queue) {
      try {
        const { error } = await supabase.from('pagos').insert([pago]);
        if (error) {
          console.error('Error syncing pago:', pago, error);
          remainingQueue.push(pago); // Keep in queue if failed
        } else {
          syncedCount++;
        }
      } catch (e) {
        console.error('Exception syncing pago:', e);
        remainingQueue.push(pago);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    return { success: remainingQueue.length === 0, synced: syncedCount, remaining: remainingQueue.length };
  }
};
