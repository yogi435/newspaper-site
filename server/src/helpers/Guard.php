<?php

require_once __DIR__ . '/../../vendor/autoload.php';

class Guard {

    public static function userIsLoggedIn() {
        return Jwt::getField('id') && Jwt::getField('level') && Jwt::getField('profileLink');
    }

    /**
     * Makes sure user is logged in
     *
     * @throws Exception 'User must be logged in'
     *
     * @return true if user is logged in, error otherwise
     */
    public static function userMustBeLoggedIn() {

        if (!Guard::userIsLoggedIn()) {
            throw new Exception('User not logged in');
        }

        return true;
    }

    /**
     * Makes sure user is logged in and a certain level
     *
     * @param $level - lowest level user can be
     *
     * @throws 'User must be logged in'
     * @throws 'User must be at least level $level'
     *
     */
    public static function userMustBeLevel(int $level) {

        Guard::userMustBeLoggedIn();

        if (Jwt::getField('level') < $level) {
            throw new Exception("User must be at least level {$level}");
        }

        return true;
    }

    /**
     * @param $password - password user gives
     * @throws Incorrect password exception
     */
    public static function withPassword(string $password) {

        $hash = Db::query("SELECT password FROM users WHERE id = ?", [Jwt::getField('id')])->fetchColumn();

        if (!password_verify($password, $hash)) {
            throw new Exception('Incorrect password');
        }

        return true;
    }
}



?>