import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Play, Pause } from 'phosphor-react-native';
import theme from '@utils/theme';

interface AudioPlayerProps {
  audioUrl: string;
}

const audioRecorderPlayer = new AudioRecorderPlayer();

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const playAudio = async () => {
    setIsPlaying(true);
    await audioRecorderPlayer.startPlayer(audioUrl);
    audioRecorderPlayer.addPlayBackListener((e) => {
      setCurrentPosition(e.currentPosition);
      setDuration(e.duration);
      if (e.currentPosition >= e.duration) {
        setIsPlaying(false);
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
      return;
    });
  };

  const pauseAudio = async () => {
    setIsPlaying(false);
    await audioRecorderPlayer.pausePlayer();
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await pauseAudio();
    } else {
      if (currentPosition >= duration) {
        setCurrentPosition(0);
      }
      await playAudio();
    }
  };

  // const formatTime = (ms: number) => {
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  // };

  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
        {isPlaying ? (
          <Pause weight="fill" size={24} color={theme.colors.primary_600} />
        ) : (
          <Play weight="fill" size={24} color={theme.colors.primary_600} />
        )}
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground} />
        <View
          style={[
            styles.progressBar,
            { width: duration ? `${(currentPosition / duration) * 100}%` : '0%' },
          ]}
        />
      </View>
      {/* <Text style={styles.timeText}>
        {formatTime(currentPosition)} / {formatTime(duration)}
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
  },
  playButton: {
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.grey_300,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.grey_400,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary_600,
  },
  timeText: {
    marginLeft: 10,
    fontSize: 12,
    color: theme.colors.text_700,
  },
});

export default AudioPlayer;
