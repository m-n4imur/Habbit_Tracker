import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth, db, storage } from "../firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CameraIcon } from "@heroicons/react/24/outline";

const ProfilePage = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBirthDate(data.birthDate || "");
        setPhone(data.phone || "");
      }
    };
    fetchUserData();
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: downloadURL });
      await updateDoc(doc(db, "users", user.uid), { photoURL: downloadURL });
      setPhotoURL(downloadURL);
      toast.success("প্রোফাইল ছবি আপডেট হয়েছে!");
    } catch (error) {
      toast.error("ছবি আপলোড ব্যর্থ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(user, { displayName: fullName });
      await updateDoc(doc(db, "users", user.uid), { fullName, birthDate });
      toast.success("প্রোফাইল আপডেট সফল!");
    } catch (error) {
      toast.error("আপডেট ব্যর্থ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">প্রোফাইল সেটিংস</h1>
            <p className="text-blue-100">আপনার ব্যক্তিগত তথ্য আপডেট করুন</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img src={photoURL || "https://via.placeholder.com/150?text=Photo"} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition shadow-md">
                  <CameraIcon className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={loading} />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">ছবি বদলাতে ক্লিক করুন</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পুরো নাম</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল (পরিবর্তনযোগ্য নয়)</label>
                <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">মোবাইল নাম্বার (পরিবর্তনযোগ্য নয়)</label>
                <input type="tel" value={phone || "যোগ করা হয়নি"} disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                <p className="text-xs text-gray-500 mt-1">মোবাইল নাম্বার শুধুমাত্র দেখা যাবে, বদলানো যাবে না।</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">জন্ম তারিখ</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50">
                {loading ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;