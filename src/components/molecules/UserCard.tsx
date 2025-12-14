import React from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import Button from '../atoms/Button/Button';
import theme from '@utils/theme';

const {colors, fonts, shadow_style} = theme;

interface UserCardProps {
  fullName: string;
  phone: string;
  status: 'active' | 'inactive';
  onActivate?: () => void;
  onDeactivate?: () => void;
  onMakeAdmin: () => void;
  onScheduleMessages?: () => void;
  hasActiveSchedule?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  fullName,
  phone,
  status,
  onActivate,
  onDeactivate,
  onMakeAdmin,
  onScheduleMessages,
  hasActiveSchedule = false,
}) => {
  const confirmAction = (action: string, callback: () => void) => {
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Yes', onPress: callback},
      ],
    );
  };

  const isInactive = status === 'inactive';

  return (
    <View style={[styles.card, shadow_style]}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName[0].toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <Text
            style={[
              styles.status,
              status === 'active' ? styles.activeStatus : styles.inactiveStatus,
            ]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.buttonWrapper}>
          <Button
            title={isInactive ? 'Activate' : 'Deactivate'}
            onPress={() =>
              isInactive
                ? confirmAction('Activate User', onActivate!)
                : confirmAction('Deactivate User', onDeactivate!)
            }
            style={isInactive ? styles.activateButton : styles.deactivateButton}
          />
        </View>
        {isInactive ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Make Admin"
              onPress={() => confirmAction('Make Admin', onMakeAdmin)}
              style={styles.adminButton}
            />
          </View>
        ) : (
          onScheduleMessages && (
            <View style={styles.buttonWrapper}>
              <Button
                title={hasActiveSchedule ? 'Manage Schedule' : 'Schedule Messages'}
                onPress={() => confirmAction('Schedule Messages', onScheduleMessages)}
                style={[
                  styles.scheduleButton,
                  hasActiveSchedule && styles.activeScheduleButton
                ]}
              />
            </View>
          )
        )}
      </View>
    </View>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.primary_600,
    fontSize: 20,
    fontFamily: fonts.satoshi_bold,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.satoshi_medium,
    color: colors.text_900,
  },
  phone: {
    fontSize: 14,
    fontFamily: fonts.satoshi_regular,
    color: colors.text_600,
    marginTop: 2,
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: fonts.satoshi_medium,
  },
  activeStatus: {
    color: colors.success_main,
  },
  inactiveStatus: {
    color: colors.error_main,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  buttonWrapper: {
    flex: 1,
  },
  activateButton: {
    backgroundColor: colors.primary_500,
    paddingVertical: 10,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  deactivateButton: {
    backgroundColor: colors.error_500,
    paddingVertical: 10,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  adminButton: {
    backgroundColor: colors.primary_400,
    paddingVertical: 10,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  scheduleButton: {
    backgroundColor: colors.primary_600,
    paddingVertical: 10,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  activeScheduleButton: {
    backgroundColor: colors.success_main,
  },
  disabledButton: {
    backgroundColor: colors.grey_300,
  },
});
