import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import supabase from '../../core/supabase';
import TopBar from '../../components/molecules/TopBar';
import BottomBar from '../../components/molecules/BottomBar';
import ChatListing from '../../screens/chats/ChatListing';

const Home: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: session } = await supabase.auth.getSession();
      const role = session?.session?.user?.user_metadata?.role;
      setIsAdmin(role === 'admin');
    };
    checkRole();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <TopBar isAdmin={isAdmin} />

      {/* Main Content */}
      <View style={styles.content}>
        <ChatListing />
      </View>

      {/* Bottom Bar */}
      <BottomBar />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 10,
  },
});
