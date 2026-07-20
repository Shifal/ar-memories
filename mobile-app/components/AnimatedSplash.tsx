import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.6);
  const lensPulse = useSharedValue(1);

  const arOpacity = useSharedValue(0);
  const arY = useSharedValue(14);
  const memoriesOpacity = useSharedValue(0);
  const memoriesY = useSharedValue(18);

  const underlineWidth = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const screenFade = useSharedValue(1);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSpring(1, { damping: 8, stiffness: 120 });

    lensPulse.value = withDelay(
      450,
      withSequence(
        withTiming(1.25, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.in(Easing.quad) })
      )
    );

    arOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));
    arY.value = withDelay(550, withSpring(0, { damping: 9 }));

    memoriesOpacity.value = withDelay(780, withTiming(1, { duration: 450 }));
    memoriesY.value = withDelay(780, withSpring(0, { damping: 9 }));

    underlineWidth.value = withDelay(1150, withTiming(72, { duration: 380, easing: Easing.out(Easing.cubic) }));

    taglineOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));

    screenFade.value = withDelay(
      2650,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: screenFade.value }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const lensStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lensPulse.value }],
  }));

  const arStyle = useAnimatedStyle(() => ({
    opacity: arOpacity.value,
    transform: [{ translateY: arY.value }],
  }));

  const memoriesStyle = useAnimatedStyle(() => ({
    opacity: memoriesOpacity.value,
    transform: [{ translateY: memoriesY.value }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    width: underlineWidth.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Simple line-art camera icon */}
      <Animated.View style={[styles.iconBox, iconStyle]}>
        <Animated.View style={[styles.lensOuter, lensStyle]}>
          <View style={styles.lensInner} />
        </Animated.View>
        <View style={styles.cornerTick} />
      </Animated.View>

      <View style={styles.wordBlock}>
        <Animated.Text style={[styles.arText, arStyle]}>AR</Animated.Text>
        <Animated.Text style={[styles.memoriesText, memoriesStyle]}>Memories</Animated.Text>
        <Animated.View style={[styles.underline, underlineStyle]} />
        <Animated.Text style={[styles.tagline, taglineStyle]}>where a photo remembers what happened</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "#F2E8D5",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#3B2A20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  lensOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: "#3B2A20",
    justifyContent: "center",
    alignItems: "center",
  },
  lensInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B2A20",
  },
  cornerTick: {
    position: "absolute",
    top: -3,
    right: 6,
    width: 10,
    height: 4,
    backgroundColor: "#F2C14E",
    borderRadius: 2,
  },
  wordBlock: {
    alignItems: "center",
  },
  arText: {
    fontFamily: "Caveat_600SemiBold",
    fontSize: 34,
    color: "#3B2A20",
  },
  memoriesText: {
    fontFamily: "Fraunces_600SemiBold_Italic",
    fontSize: 40,
    color: "#D6614A",
    marginTop: -4,
  },
  underline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F2C14E",
    marginTop: 10,
  },
  tagline: {
    fontFamily: "Caveat_600SemiBold",
    fontSize: 18,
    color: "#7d6a55",
    marginTop: 14,
    textAlign: "center",
  },
});