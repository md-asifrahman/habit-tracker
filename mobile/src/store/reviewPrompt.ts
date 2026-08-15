import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

/**
 * Asks for a Play Store rating once, at the only moment it's fair to ask: just after the user
 * finished a challenge they actually kept up with. Review count and recency feed Play's ranking,
 * so this is the one thing inside the app that moves store visibility.
 *
 * Deliberately conservative:
 *   - asked at most once, ever, per install
 *   - only after a challenge is finished, and only if they logged most of it
 *   - never blocks anything; every failure path is silent
 *
 * Google's In-App Review API also enforces its own quota and may show nothing at all. That's
 * fine — it must never be something the app depends on.
 */

const ASKED_KEY = 'habittracker.reviewAsked';

/** Don't ask someone who barely used the app — they have nothing good to say yet. */
const MIN_DAYS_LOGGED = 5;
const MIN_AVERAGE_PERCENT = 60;

export async function maybeAskForReview(daysLogged: number, averagePercent: number): Promise<void> {
  try {
    if (daysLogged < MIN_DAYS_LOGGED || averagePercent < MIN_AVERAGE_PERCENT) return;
    if (await AsyncStorage.getItem(ASKED_KEY)) return;
    if (!(await StoreReview.hasAction())) return;

    // Record the attempt before showing it: the API gives no callback, and asking twice is
    // worse than never asking.
    await AsyncStorage.setItem(ASKED_KEY, new Date().toISOString());
    await StoreReview.requestReview();
  } catch {
    // A rating prompt is never worth surfacing an error for.
  }
}
