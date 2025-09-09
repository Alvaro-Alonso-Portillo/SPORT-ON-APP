
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered on user document update in Firestore.
 * If the user's photoURL changes, this function finds all classes
 * the user is attending and updates their photoURL in the attendees list.
 */
export const updateAttendeePhotoOnProfileChange = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // Check if the photoURL has actually changed
    if (beforeData.photoURL === afterData.photoURL) {
      functions.logger.log(
        `User ${userId} was updated, but photoURL did not change. Exiting.`,
      );
      return null;
    }

    const newPhotoURL = afterData.photoURL;
    functions.logger.log(
      `User ${userId} updated their photoURL. New URL: ${newPhotoURL}.`,
      `Searching for classes to update.`,
    );

    try {
      // Find all classes where the user is an attendee
      const classesQuerySnapshot = await db.collection("classes")
        .where("attendees", "array-contains", {
          uid: userId,
          name: beforeData.name,
          photoURL: beforeData.photoURL,
        }).get();

      if (classesQuerySnapshot.empty) {
        functions.logger.log(
          `No classes found for user ${userId} to update.`,
        );
        return null;
      }

      const batch = db.batch();

      classesQuerySnapshot.forEach((doc) => {
        const classData = doc.data();
        const attendees = classData.attendees as {
            uid: string,
            name: string,
            photoURL?: string
        }[];

        // Find the specific attendee and update their photoURL
        const updatedAttendees = attendees.map((attendee) => {
          if (attendee.uid === userId) {
            return { ...attendee, photoURL: newPhotoURL };
          }
          return attendee;
        });

        batch.update(doc.ref, { attendees: updatedAttendees });
      });

      await batch.commit();
      functions.logger.log(
        `Successfully updated photoURL for user ${userId} in ${classesQuerySnapshot.size} classes.`,
      );
      return { success: true, updatedClasses: classesQuerySnapshot.size };
    } catch (error) {
      functions.logger.error(
        "Error updating attendee photo URLs:",
        error,
      );
      // Re-throw the error to indicate failure
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update photo URLs in classes.",
        error,
      );
    }
  });
