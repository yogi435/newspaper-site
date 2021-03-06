<?php

require_once(__DIR__ . '/../../vendor/autoload.php');

use Faker\Provider\Base;



/**
  * Methods generate data in same format as expected as in database rows with method name
  * @example GenerateMockValues->user will generate data fit for insertion into database's `user` table
  *
  */
class GenerateMockRow {

    private static $faker; // as to avoid duplicate fields later, need 1 instance of faker only

    public function __construct() {
        GenerateMockRow::$faker = Faker\Factory::create();
    }

    public function user() {

        return [
            'id' => GenerateMockRow::$faker->unique()->randomNumber() + 1 . '',
            'username' => GenerateMockRow::$faker->unique()->userName(),
            'f_name' => GenerateMockRow::$faker->unique()->firstName(),
            'm_name' => GenerateMockRow::$faker->boolean() ? GenerateMockRow::$faker->suffix() : null,
            'l_name' => filter_var(GenerateMockRow::$faker->lastName(), FILTER_SANITIZE_STRING), // prevents O'Reilly
            'password' => GenerateMockRow::$faker->password(),
            'email' => GenerateMockRow::$faker->email(),
            'level' => rand(1, 3),
            'auth' => GenerateMockRow::$faker->password(),
            'auth_time' => GenerateMockRow::$faker->date(),
            'notifications' => +GenerateMockRow::$faker->boolean(),
            'two_fa_enabled' => +GenerateMockRow::$faker->boolean()
        ];
    }

    public function tag_list() {

        return [
          'tag' => substr(GenerateMockRow::$faker->unique()->word(), 0, 20) // varchar(20)
        ];
    }

    public function issue() {

        return [
            'num' => GenerateMockRow::$faker->unique()->randomNumber(),
            'ispublic' => 1,
            'name' => substr(GenerateMockRow::$faker->unique()->name(), 0, 20), // db varchar(20)
            'madepub' => GenerateMockRow::$faker->date()
        ];
    }

    private function randomHtml() {

        return strip_tags(GenerateMockRow::$faker->randomHtml(), "<h1><h2><h3><h4><h5><h6><pre><img><p><a><table><td><tr><th><tbody><thead><tfoot><strong><b><em><i><u><sub><sup><font><strike><ul><ol><li><q><blockquote><br><abbr><div><span>");
    }

    private function randomCommentHtml() {

        $config = HTMLPurifier_Config::createDefault(); // these rules are from fields/mutations/createComment
        $config->set('URI.AllowedSchemes', ['http' => true,
                                            'https' => true,
                                            'mailto' => true
                                            ]);
        $config->set('AutoFormat.RemoveEmpty', true); // remove empty tag pairs
        $config->set('AutoFormat.RemoveEmpty.RemoveNbsp', true); // remove empty, even if it contains an &nbsp;
        $config->set('CSS.AllowedProperties', 'href');
        $config->set('AutoFormat.AutoParagraph', true); // remove empty tag pairs
        $config->set('HTML.Allowed', 'div,code,pre,p,a[href],strong,b,em,i,u,sub,sup,strike,ul,ol,li,q,blockquote,br,abbr');

        $dbMaxContentLength = 500;
        $content = substr($this->randomHtml(), 0, $dbMaxContentLength);

        $purifier = new HTMLPurifier($config);
        return $purifier->purify($content);
    }

    public function pageinfo() {

        $faker = GenerateMockRow::$faker;

        $url = '';

        while (strlen($url) < $_ENV['URL_LENGTH']) {
            $url .= $faker->unique()->domainWord();
        }

        return [
            'id' => GenerateMockRow::$faker->unique()->randomNumber() + 1 . '',
            'created' => GenerateMockRow::$faker->date(),
            'url' => $url,
            'lede' => "<h1>{$faker->word()}</h1><h4>{$faker->name()}</h4><p>{$faker->paragraph()}</p>",
            'body' => $this->randomHtml(),
            'issue' => GenerateMockRow::$faker->randomNumber(), // todo: replace, foreign key
            'authorid' => GenerateMockRow::$faker->randomNumber(), // ditto
            'views' => GenerateMockRow::$faker->randomNumber(),
            'display_order' => GenerateMockRow::$faker->randomNumber()
        ];
    }

    public function image() {

        return [
            'id' => GenerateMockRow::$faker->unique()->randomNumber() + 1,
            'art_id' => GenerateMockRow::$faker->unique()->randomNumber(),
            'slide' => +GenerateMockRow::$faker->boolean(),
            'url' => GenerateMockRow::$faker->imageUrl()
        ];
    }

    public function tag() {

        return [
            'id' => GenerateMockRow::$faker->unique()->randomNumber() + 1,
            'tag' => GenerateMockRow::$faker->word(), // to be replaced
            'art_id' => GenerateMockRow::$faker->unique()->randomNumber(), // ditto
        ];
    }

    public function comment() {

        return [
            'id' => GenerateMockRow::$faker->unique()->randomNumber() + 1 . '',
            'art_id' => -1, // replaced later
            'authorid' => -1, // replaced later
            'content' => $this->randomCommentHtml(),
            'created' => GenerateMockRow::$faker->date()
        ];
    }
}

?>
