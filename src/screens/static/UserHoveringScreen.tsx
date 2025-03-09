import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useUser } from "@hooks/UserContext";
import theme from "@utils/theme";

const UserHoveringScreen = () => {
  const { user } = useUser();
  
  // Animated Opacity
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animated Bounce for Dots
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Bounce Animation Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Pulsating Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          />
        ))}
      </View>

      {/* Waiting Message */}
      <View style={styles.messageBox}>
        <Text style={styles.title}>Hello, {user?.fullName || "User"}! 👋</Text>
        <Text style={styles.subtitle}>Your account is waiting for activation.</Text>
        <Text style={styles.smallText}>An admin will activate your account soon.</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.black_17,
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: theme.colors.primary_500,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  messageBox: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 5,
  },
  smallText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
});

export default UserHoveringScreen;
