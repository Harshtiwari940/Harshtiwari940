<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'website' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', '' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'G%FB{bSmsYA@MISFLbmwp##B~3NK=ZaV1[L!fl&rXUSHt;eq+?r~.z=HB>3`zf;l' );
define( 'SECURE_AUTH_KEY',  ' #WNhm:<yH|0MZQdP/8=:_2a`,z @Gul!T,39rTefNa49%7GBlWT3[(ub@G6En_*' );
define( 'LOGGED_IN_KEY',    'RGnmce-cKbt][Vs(ItL+T{7nf!x-_4c@TH+Zr{6|VK<=??==AW{g}8&)x:rho6Y_' );
define( 'NONCE_KEY',        '!$Ql~kH1v-w[bx[-UKKn`qIy*`}0~X}wC+@-W!(Z p~.s`De0P6#(fBzk1*Cyz}!' );
define( 'AUTH_SALT',        'f(4$ZYgX8g(C|o0<4IQl>CZMn=Ktwo?;+4iI&haZl9/WwZmb}8.iyEpLzbF)Ev@Y' );
define( 'SECURE_AUTH_SALT', 'Mik>@bMNxuXzA~[D@LNn5dQIa[:yt4RDXJsfei6n!T:-=eOCl sSLGF` };.B_^8' );
define( 'LOGGED_IN_SALT',   '!PhX6;Qr,$z7u[;7> :Ae}e+tX$)ff^wi=3H5jaU_#=&1ZQTFh+/&>0Ax:stjC%a' );
define( 'NONCE_SALT',       'TPMsfj^GMmYqo>Ml5.<eXJ]+,[6e4{k/qQ~}NQ407Cn^dQC`_x3yn&>3q/S)~?aq' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
