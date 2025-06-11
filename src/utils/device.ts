import { Dimensions } from 'react-native';
import rn_device from 'react-native-device-info';

export const get_device_info = ({ width, height }: any) => {
	const new_device = {
		width: 0,
		height: 0,
		isTablet: false,
		isTabletPortrait: false,
		isTabletLandscape: false,
	};

	new_device.isTablet = rn_device.isTablet();
	new_device.width = width;
	new_device.height = height;
	new_device.isTabletPortrait = new_device.isTablet && height > width;
	new_device.isTabletLandscape = new_device.isTablet && !new_device.isTabletPortrait;

	return new_device;
};

let device = get_device_info(Dimensions.get('window'));

export const set_device_info = ({ width, height }: any) => {
	device = get_device_info({ width, height });
};

export default device;