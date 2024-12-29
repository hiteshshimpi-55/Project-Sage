import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Auth = () => {
  return (
    <View>
      <Text>Auth</Text>
    </View>
  )
}

export default Auth

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