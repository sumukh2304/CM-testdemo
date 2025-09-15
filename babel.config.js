module.exports = function (api) {
	api.cache(true)
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			'@babel/plugin-transform-class-static-block',
			// Commented out worklets plugin as it's causing compilation issues
			// 'react-native-worklets/plugin',
		],
	}
}

