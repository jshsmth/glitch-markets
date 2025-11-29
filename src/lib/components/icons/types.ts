/**
 * Shared icon component props interface
 * Use this in all icon components for consistency
 */
export interface IconProps {
	/**
	 * Size of the icon in pixels
	 * @default 24
	 */
	size?: number;

	/**
	 * Color of the icon
	 * @default 'currentColor'
	 */
	color?: string;

	/**
	 * Additional CSS class names
	 */
	class?: string;
}

/**
 * Extended icon props with additional functionality
 */
export interface ExtendedIconProps extends IconProps {
	/**
	 * Aria label for accessibility
	 */
	'aria-label'?: string;

	/**
	 * Whether the icon is decorative (aria-hidden)
	 * @default false
	 */
	decorative?: boolean;
}
