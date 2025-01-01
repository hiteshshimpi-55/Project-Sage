import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <View style={styles.container}>
      {/* Table Headers */}
      <View style={styles.headerRow}>
        {headers.map((header, index) => (
          <Text key={index} style={styles.headerText}>
            {header}
          </Text>
        ))}
      </View>
      {/* Table Rows */}
      {children}
    </View>
  );
};

export default Table;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    padding: 10,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
