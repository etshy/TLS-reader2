<?php
/**
 * Created by PhpStorm.
 * User: Etshy
 * Date: 05/08/2017
 * Time: 22:52
 */


//Mettre ce fichier php sur le serveur stockant les epubs !

/**
 * CONFIG
 */

$epubFolders = "bookshelf/";
//Max hierarchy to search
$hierarchyLevelMax = 3;

$extensionsAllowed = array('jpg', 'jpeg', 'png');

/**
 * ENF CONFIG
 */

header("Access-Control-Allow-Origin: *");

function listFolders($dir, $hierarchyLevel, $hierarchyLevelMax)
{
    global $extensionsAllowed;
    $hierarchyLevel++;
    $dh = scandir($dir);
    $return = array();

    $folderPath = null;

    //TODO lorsqu'on arrive au dernier niveau de hierarchie (avec les images) on les tries pour etre sur qu'elle soient dans l'ordre.
    foreach ($dh as $folder) {
        if (substr($folder, 0, 1) !== "." && substr($folder, 0, 5) !== "index") {
            $folderPath = $dir . '/' . $folder;
            if (is_dir($folderPath)) {
                if($hierarchyLevel == $hierarchyLevelMax)
                {
                    $return[$folder] = array();
                } else {
                    $return[$folder] = listFolders($folderPath, $hierarchyLevel, $hierarchyLevelMax);
                }
            } else {
                //FILE
                //TODO Detect file extension and adapt array key ('image', 'synopsis' etc.)
                $extension = substr($folder, strrpos($folder, ".") + 1);

                if(!in_array($extension, $extensionsAllowed)){
                    //Other than a image file
                } else {
                    $return[] = $folder;
                }

            }
        }
    }
    if(isset($folderPath) && !is_dir($folderPath) && $hierarchyLevel == $hierarchyLevelMax) {
        //on est dans le dossier d'images
        natsort ($return);
        $return = array_values($return);
    }
    return $return;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $folders = listFolders($epubFolders, 0, $hierarchyLevelMax);

    header('Content-Type: application/json');
    echo json_encode($folders);
}
