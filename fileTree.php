<?php
/**
 * Created by PhpStorm.
 * User: Etshy
 * Date: 05/08/2017
 * Time: 22:52
 */

//Put this file on the web server where you store your releases and want to offer an online reader

/**
 * CONFIG
 */

//$epubFolders because ... wanted to do the reader for epub file only and didn't change the variable
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
