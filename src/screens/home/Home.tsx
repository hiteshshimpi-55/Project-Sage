import { StyleSheet, Text, View } from 'react-native'
import React from 'react'


import {NativeStackScreenProps} from "@react-navigation/native-stack"

import { RootStackParamList } from '../../App'

type HomeProps = NativeStackScreenProps<RootStackParamList,'Home'>

const Home = ({navigation}:HomeProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.smallText}>Home</Text>
      <Text onPress={()=>navigation.navigate('Auth')}>Go to Profile</Text>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    smallText:{
        color:'red',
        fontSize:12
    }
})