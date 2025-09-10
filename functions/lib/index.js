"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendeePhotoOnProfileChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
/**
 * Triggered on user document update in Firestore.
 * If the user's photoURL changes, this function finds all classes
 * the user is attending and updates their photoURL in the attendees list.
 */
exports.updateAttendeePhotoOnProfileChange = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;
    // Check if the photoURL has actually changed
    if (beforeData.photoURL === afterData.photoURL) {
        functions.logger.log(`User ${userId} was updated, but photoURL did not change. Exiting.`);
        return null;
    }
    const newPhotoURL = afterData.photoURL;
    functions.logger.log(`User ${userId} updated their photoURL. New URL: ${newPhotoURL}.`, `Searching for classes to update.`);
    try {
        // Find all classes where the user is an attendee, using their OLD data to find them.
        const classesQuerySnapshot = await db.collection("classes")
            .where("attendees", "array-contains", {
            uid: userId,
            name: beforeData.name, // Use old name to match the existing record
            photoURL: beforeData.photoURL, // Use old photoURL to find the record
        }).get();
        // Also query for cases where the user had no photoURL before
        const classesWithoutPhotoSnapshot = await db.collection("classes")
            .where("attendees", "array-contains", {
            uid: userId,
            name: beforeData.name,
        }).get();
        if (classesQuerySnapshot.empty && classesWithoutPhotoSnapshot.empty) {
            functions.logger.log(`No classes found for user ${userId} to update.`);
            return null;
        }
        const batch = db.batch();
        const docsToUpdate = new Map();
        // Process first query results
        classesQuerySnapshot.forEach((doc) => {
            docsToUpdate.set(doc.id, doc.data());
        });
        // Process second query results, avoiding duplicates
        classesWithoutPhotoSnapshot.forEach((doc) => {
            if (!docsToUpdate.has(doc.id)) {
                docsToUpdate.set(doc.id, doc.data());
            }
        });
        docsToUpdate.forEach((classData, id) => {
            const docRef = db.collection("classes").doc(id);
            const attendees = classData.attendees;
            // Find the specific attendee and update their photoURL
            const updatedAttendees = attendees.map((attendee) => {
                if (attendee.uid === userId) {
                    return { ...attendee, photoURL: newPhotoURL };
                }
                return attendee;
            });
            batch.update(docRef, { attendees: updatedAttendees });
        });
        await batch.commit();
        functions.logger.log(`Successfully updated photoURL for user ${userId} in ${docsToUpdate.size} classes.`);
        return { success: true, updatedClasses: docsToUpdate.size };
    }
    catch (error) {
        functions.logger.error("Error updating attendee photo URLs:", error);
        // Re-throw the error to indicate failure
        throw new functions.https.HttpsError("internal", "Failed to update photo URLs in classes.", error);
    }
});
//# sourceMappingURL=index.js.map