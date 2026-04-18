import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { format, addDays, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const DashboardPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [newHabitName, setNewHabitName] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(habitsData);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const q = query(collection(db, "completions"), where("userId", "==", user.uid), where("date", "==", dateStr));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const compMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        compMap[data.habitId] = { completed: data.completed, docId: doc.id };
      });
      setCompletions(compMap);
    });
    return unsubscribe;
  }, [user, selectedDate]);

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    try {
      await addDoc(collection(db, "habits"), {
        userId: user.uid,
        name: newHabitName.trim(),
        createdAt: new Date().toISOString()
      });
      setNewHabitName("");
      toast.success("অভ্যাস যোগ করা হয়েছে");
    } catch (error) {
      toast.error("যোগ করতে ব্যর্থ হয়েছে");
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await deleteDoc(doc(db, "habits", habitId));
      toast.success("অভ্যাস মুছে ফেলা হয়েছে");
    } catch (error) {
      toast.error("মুছতে ব্যর্থ হয়েছে");
    }
  };

  const toggleCompletion = async (habitId, completed) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existing = completions[habitId];
    try {
      if (existing) {
        await updateDoc(doc(db, "completions", existing.docId), { completed });
      } else {
        await addDoc(collection(db, "completions"), {
          userId: user.uid,
          habitId,
          date: dateStr,
          completed
        });
      }
    } catch (error) {
      toast.error("আপডেট ব্যর্থ");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white shadow-xl flex flex-col p-4 border-r">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 আমার অভ্যাস</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addHabit()} placeholder="নতুন অভ্যাস যোগ করুন" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addHabit} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">
            <PlusIcon className="h-5 w-5" />
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          <AnimatePresence>
            {habits.map(habit => (
              <motion.div key={habit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 group">
                <span className="font-medium text-gray-700">{habit.name}</span>
                <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {habits.length === 0 && <p className="text-gray-400 text-center py-8">এখনও কোনো অভ্যাস নেই</p>}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-semibold text-gray-800">হ্যালো, {user?.displayName?.split(' ')[0] || "ব্যবহারকারী"}!</h1>
          <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-full">
            <button onClick={() => setSelectedDate(d => subDays(d, 1))}><ChevronLeftIcon className="h-5 w-5 text-gray-600" /></button>
            <motion.span key={selectedDate.toString()} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-medium text-gray-700 min-w-[200px] text-center">{format(selectedDate, "EEEE, dd MMM yyyy")}</motion.span>
            <button onClick={() => setSelectedDate(d => addDays(d, 1))}><ChevronRightIcon className="h-5 w-5 text-gray-600" /></button>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
            {habits.length === 0 ? (
              <p className="text-center text-gray-400 py-12">বাম পাশ থেকে অভ্যাস যোগ করুন</p>
            ) : (
              <div className="space-y-2">
                {habits.map(habit => {
                  const isCompleted = completions[habit.id]?.completed || false;
                  return (
                    <motion.div key={habit.id} whileTap={{ scale: 0.98 }} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 rounded-lg transition cursor-pointer" onClick={() => toggleCompletion(habit.id, !isCompleted)}>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${isCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {isCompleted && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </div>
                      <span className={`ml-4 text-lg transition ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{habit.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;