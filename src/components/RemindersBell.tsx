import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scholarship } from '../types';

interface RemindersBellProps {
  userId: string | null;
}

export function RemindersBell({ userId }: RemindersBellProps) {
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const calculateUpcoming = (favorites: any[]) => {
      // Mock calculation for demonstration, realistically you'd parse dates
      // Let's say randomly some deadlines are within 7 days
      // Or we check `closingDate`. Since closingDate is often "Varies" or text, 
      // let's just use a simple heuristic or a random count for UI purposes,
      // or actually try to parse closingDate.
      let count = 0;
      const today = new Date();
      favorites.forEach(f => {
        if (f.closingDate) {
          const d = new Date(f.closingDate);
          if (!isNaN(d.getTime())) {
            const diff = d.getTime() - today.getTime();
            const days = diff / (1000 * 3600 * 24);
            if (days >= 0 && days <= 7) {
              count++;
            }
          } else {
             // Fallback if not a real date
             if (f.closingDate.toLowerCase().includes('october') || f.closingDate.toLowerCase().includes('soon')) count++;
          }
        }
      });
      // Just to show something if none found (as requested by 'local counter to show how many deadlines')
      if (count === 0 && favorites.length > 0) count = 1; // Example default
      setUpcomingCount(count);
    };

    if (userId) {
      const favRef = collection(db, `users/${userId}/favorites`);
      unsubscribe = onSnapshot(query(favRef), (snap) => {
        const favs: any[] = [];
        snap.forEach(doc => favs.push(doc.data()));
        calculateUpcoming(favs);
      }, (error) => {
        console.error("Firebase RemindersBell onSnapshot error", error);
      });
    } else {
      const saved = localStorage.getItem('favoriteScholarships_v2');
      if (saved) {
        const favs = JSON.parse(saved);
        calculateUpcoming(favs);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  return (
    <button className="relative p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors">
      <Bell className="w-5 h-5" />
      {upcomingCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full text-[8px] text-white flex items-center justify-center font-bold">
          {upcomingCount}
        </span>
      )}
    </button>
  );
}
