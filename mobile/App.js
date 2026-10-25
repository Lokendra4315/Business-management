import React, {useEffect, useState, createContext, useContext} from 'react';
import {ActivityIndicator, Alert, Button, FlatList, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {api} from './src/api';

const Stack = createNativeStackNavigator();
const AuthContext = createContext(null);
const styles = {
  page:{flex:1,backgroundColor:'#f4f6fa',padding:18},
  title:{fontSize:26,fontWeight:'800',color:'#172554',marginBottom:18},
  input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dbe2ef',borderRadius:10,padding:13,marginBottom:12,fontSize:16},
  card:{backgroundColor:'#fff',padding:16,borderRadius:14,marginBottom:12},
  button:{backgroundColor:'#1d4ed8',padding:14,borderRadius:10,alignItems:'center',marginBottom:12},
  buttonText:{color:'#fff',fontWeight:'700',fontSize:16},
  muted:{color:'#64748b',marginBottom:8},
  row:{flexDirection:'row',justifyContent:'space-between',gap:8,marginBottom:10},
  small:{fontSize:13,color:'#64748b'}
};
function Field({value,onChangeText,placeholder,secureTextEntry,keyboardType}) {
  return <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry} keyboardType={keyboardType}/>;
}
function Primary({title,onPress}) { return <TouchableOpacity style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>; }

function AuthScreen({navigation, route}) {
  const {setToken} = useContext(AuthContext);
  const signup = route.name === 'SignUp';
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false);
  const submit=async()=>{
    if(!email.trim() || !password || (signup && !name.trim())) return Alert.alert('Required','Please complete all fields.');
    setBusy(true);
    try {
      const {data}=await api.post(`/auth/${signup?'signup':'login'}`,{name,email,password});
      await AsyncStorage.setItem('token',data.token); setToken(data.token);
    } catch(e){Alert.alert('Error',e.response?.data?.message || 'Cannot connect to API. Check backend and API_URL.');}
    finally{setBusy(false);}
  };
  return <SafeAreaView style={styles.page}><Text style={styles.title}>Business Manager</Text><Text style={styles.muted}>{signup?'Create your account':'Sign in to manage your businesses'}</Text>
    {signup && <Field value={name} onChangeText={setName} placeholder="Full name"/>}
    <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address"/>
    <Field value={password} onChangeText={setPassword} placeholder="Password (min 8 characters)" secureTextEntry/>
    <Primary title={busy?'Please wait...':signup?'Create account':'Login'} onPress={submit}/>
    <Button title={signup?'Already have an account? Login':'New user? Sign up'} onPress={()=>navigation.navigate(signup?'Login':'SignUp')}/>
  </SafeAreaView>;
}

function BusinessesScreen({navigation}) {
  const [items,setItems]=useState([]),[name,setName]=useState(''),[type,setType]=useState('HOTEL'),[address,setAddress]=useState('');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{api.get('/businesses').then(r=>setItems(r.data)).catch(e=>Alert.alert('Error',e.response?.data?.message||'Could not load businesses'));},[refresh]);
  const add=async()=>{try{await api.post('/businesses',{name,type,address});setName('');setAddress('');setRefresh(x=>x+1);}catch(e){Alert.alert('Error',e.response?.data?.message||'Could not create business');}};
  const types=['HOTEL','HOSTEL','HOME','COMPANY'];
  return <ScrollView style={styles.page}>
    <Text style={styles.title}>My Businesses</Text>
    <View style={styles.card}><Text style={{fontWeight:'700',marginBottom:10}}>Add business / property</Text>
      <Field value={name} onChangeText={setName} placeholder="Business name"/>
      <Text style={styles.muted}>Type: {type}</Text>
      <View style={styles.row}>{types.map(t=><TouchableOpacity key={t} onPress={()=>setType(t)} style={{padding:8,backgroundColor:type===t?'#dbeafe':'#f1f5f9',borderRadius:8}}><Text>{t}</Text></TouchableOpacity>)}</View>
      <Field value={address} onChangeText={setAddress} placeholder="Address (optional)"/>
      <Primary title="Add business" onPress={add}/>
    </View>
    {items.map(b=><TouchableOpacity key={b.id} style={styles.card} onPress={()=>navigation.navigate('Dashboard',{business:b})}>
      <Text style={{fontSize:18,fontWeight:'700'}}>{b.name}</Text><Text style={styles.muted}>{b.type} · {b.address||'No address'}</Text><Text style={{color:'#1d4ed8'}}>Open dashboard →</Text>
    </TouchableOpacity>)}
    {!items.length && <Text style={styles.muted}>No businesses yet. Add your first one above.</Text>}
  </ScrollView>;
}

function DashboardScreen({route,navigation}) {
  const {business}=route.params; const [data,setData]=useState(null);
  const load=()=>api.get(`/dashboard/${business.id}`).then(r=>setData(r.data)).catch(()=>Alert.alert('Error','Could not load dashboard'));
  useEffect(()=>{const unsub=navigation.addListener('focus',load);load();return unsub;},[navigation,business.id]);
  const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
  return <ScrollView style={styles.page}><Text style={styles.title}>{business.name}</Text>
    <Text style={styles.muted}>{business.type} · Financial overview</Text>
    {data?<><View style={styles.card}><Text style={styles.small}>TOTAL INCOME</Text><Text style={{fontSize:25,fontWeight:'800',color:'#15803d'}}>{money(data.income)}</Text></View>
      <View style={styles.card}><Text style={styles.small}>TOTAL EXPENSES</Text><Text style={{fontSize:25,fontWeight:'800',color:'#dc2626'}}>{money(data.expenses)}</Text></View>
      <View style={styles.card}><Text style={styles.small}>NET BALANCE</Text><Text style={{fontSize:25,fontWeight:'800'}}>{money(data.balance)}</Text></View></>:<ActivityIndicator/>}
    <Primary title="+ Add income" onPress={()=>navigation.navigate('AddTransaction',{business,type:'INCOME'})}/>
    <Primary title="+ Add expense" onPress={()=>navigation.navigate('AddTransaction',{business,type:'EXPENSE'})}/>
    <Primary title="Transaction history" onPress={()=>navigation.navigate('Transactions',{business})}/>
  </ScrollView>;
}

function AddTransactionScreen({route,navigation}) {
  const {business,type}=route.params; const [category,setCategory]=useState(''),[amount,setAmount]=useState(''),[description,setDescription]=useState('');
  const save=async()=>{try{await api.post('/transactions',{businessId:business.id,type,category,amount:Number(amount),description});Alert.alert('Saved',`${type} recorded successfully`);navigation.goBack();}catch(e){Alert.alert('Error',e.response?.data?.message||'Could not save transaction');}};
  return <SafeAreaView style={styles.page}><Text style={styles.title}>Add {type.toLowerCase()}</Text>
    <Field value={category} onChangeText={setCategory} placeholder="Category (e.g. Rent, Salary, Food)"/>
    <Field value={amount} onChangeText={setAmount} placeholder="Amount in INR" keyboardType="decimal-pad"/>
    <Field value={description} onChangeText={setDescription} placeholder="Description (optional)"/>
    <Primary title="Save transaction" onPress={save}/>
  </SafeAreaView>;
}

function TransactionsScreen({route}) {
  const {business}=route.params;const [rows,setRows]=useState([]);
  useEffect(()=>{api.get('/transactions',{params:{businessId:business.id}}).then(r=>setRows(r.data)).catch(()=>Alert.alert('Error','Could not load transactions'));},[business.id]);
  return <FlatList style={styles.page} data={rows} keyExtractor={x=>x.id} ListEmptyComponent={<Text style={styles.muted}>No transactions recorded.</Text>}
    ListHeaderComponent={<Text style={styles.title}>Transactions</Text>} renderItem={({item})=><View style={styles.card}>
      <View style={styles.row}><Text style={{fontWeight:'700'}}>{item.category}</Text><Text style={{fontWeight:'800',color:item.type==='INCOME'?'#15803d':'#dc2626'}}>{item.type==='INCOME'?'+':'-'}₹{Number(item.amount).toLocaleString('en-IN')}</Text></View>
      {!!item.description&&<Text style={styles.muted}>{item.description}</Text>}<Text style={styles.small}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
    </View>}/>;
}

function MainNavigator() {
  const {setToken}=useContext(AuthContext);
  return <Stack.Navigator><Stack.Screen name="Businesses" component={BusinessesScreen} options={{headerRight:()=> <Button title="Logout" onPress={async()=>{await AsyncStorage.removeItem('token');setToken(null);}}/>}}/>
    <Stack.Screen name="Dashboard" component={DashboardScreen}/><Stack.Screen name="AddTransaction" component={AddTransactionScreen}/>
    <Stack.Screen name="Transactions" component={TransactionsScreen}/></Stack.Navigator>;
}
function AuthNavigator(){return <Stack.Navigator screenOptions={{headerShown:false}}><Stack.Screen name="Login" component={AuthScreen}/><Stack.Screen name="SignUp" component={AuthScreen}/></Stack.Navigator>;}

export default function App(){
  const [token,setToken]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{AsyncStorage.getItem('token').then(setToken).finally(()=>setLoading(false));},[]);
  if(loading)return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator size="large"/></View>;
  return <AuthContext.Provider value={{setToken}}><NavigationContainer>{token?<MainNavigator/>:<AuthNavigator/>}</NavigationContainer></AuthContext.Provider>;
}
