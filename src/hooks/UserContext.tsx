import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  gender?: string;
  age?: number;
  dob?: string;
  isAdmin: boolean;
  activationDate?: string;
}

interface UserContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const setUserContext = (user: User | null): void => {
  const context = useContext(UserContext);
  if (context) {
    context.setUser(user);
  }
  else {
    throw new Error('useUser must be used within a UserProvider');
  }
};