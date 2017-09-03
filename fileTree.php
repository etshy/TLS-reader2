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

/**
 * ENF CONFIG
 */

header("Access-Control-Allow-Origin: *");

function listFolders($dir, $hierarchyLevel, $hierarchyLevelMax)
{
    $hierarchyLevel++;
    $dh = scandir($dir);
    $return = array();

    $folderPath = null;

    //TODO lorsqu'on arrive au dernier niveau de hierarchie (avec les images) on les tries pour etre sur qu'elle soient dans l'ordre.
    foreach ($dh as $folder) {
        if ($folder != '.' && $folder != '..') {
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

                $return[] = $folder;
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
