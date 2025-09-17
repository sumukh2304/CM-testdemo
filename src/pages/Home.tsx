import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import SiteFooter from "../components/SiteFooter";

interface HomeProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

export default function Home({ navigation }: HomeProps) {
  const navigate = useNavigate();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleNavigate = (path: string) => {
    if (navigation) {
      // For React Native navigation
      navigation.navigate(path);
    } else {
      // For React Router navigation (web)
      navigate(path);
    }
  };

  return (
    <>
    <ImageBackground
      source={require("../../assets/cartoon-movie.png")}
      style={[
        styles.mainBackground,
        Platform.OS === 'web' ? { minHeight: '100vh' as any } : null,
      ]}
      resizeMode="cover"
    >
      <View style={styles.mainOverlay} />
      
      <View style={styles.container}>
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}> 
          {/* Centered circular image above the title */}
          <Animated.View style={[styles.heroLogoWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            <View style={styles.heroLogoGlow} />
            <Image
              source={require("../../assets/home.jpeg")}
              style={styles.heroLogoImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.Text style={[styles.heroTitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            Unlimited Cartoons & Animation Movies
            {"\n"}and more
          </Animated.Text>
          <Animated.Text style={[styles.heroSubtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            Watch anywhere. Anytime. Join millions of viewers enjoying
            Cartoon Movie.
          </Animated.Text>
          <Animated.Text style={[styles.heroNote, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            Content not for Monetization
          </Animated.Text>

          <Animated.View style={[styles.heroButtons, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => handleNavigate("/register")}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.altButton}
              onPress={() => handleNavigate("/login")}
              activeOpacity={0.8}
            >
              <Text style={styles.altText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.badges}>
            {/* <Text style={styles.badge}>No ads</Text>
            <Text style={styles.badge}>Full HD</Text>
            <Text style={styles.badge}>Kids-safe</Text> */}
          </View>
        </Animated.View>


      </View>
    </ImageBackground>
    <SiteFooter />
    </>
  );
}

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    flex: 1,
    paddingTop: 10,
  },
  heroLogoWrap: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    borderColor: '#CC5500',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    marginTop: -50,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  heroLogoGlow: {
    position: 'absolute',
    inset: 0 as any,
    backgroundColor: 'transparent',
    boxShadow: '0 0 120px rgba(204,85,0,0.35)',
  } as any,
  heroLogoImage: {
    width: '90%',
    height: '90%',
    maxWidth: '90%',
    maxHeight: '90%',
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: 52,
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 58,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 24,
    color: "#eaeaea",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 32,
    maxWidth: 700,
    fontWeight: "400",
  },
  heroNote: {
    fontSize: 14,
    color: "#cfcfcf",
    textAlign: "center",
    marginTop: -36,
    marginBottom: 40,
    opacity: 0.9,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButton: {
    backgroundColor: "#CC5500",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  altButton: {
    backgroundColor: "#708238",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  altText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  badge: {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    fontSize: 12,
  },
});
