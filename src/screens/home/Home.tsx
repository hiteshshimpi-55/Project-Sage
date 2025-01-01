import { StyleSheet, Text, View } from 'react-native'
import React from 'react'


import {NativeStackScreenProps} from "@react-navigation/native-stack"

import { RootStackParamList } from '../../App'
import ChatScreen from '../chats/Chat'

type HomeProps = NativeStackScreenProps<RootStackParamList,'Home'>

const Home = ({navigation}:HomeProps) => {
  return (
      <ChatScreen/>
  )
}

export default Home