<?php
    require 'connect.php';
    $phone=$_POST["phone"];
    $pass=$_POST["password"];
    $name=$_POST["name"];
    $sql="Insert Into user(name,phone,password) Values('$name','$phone','$pass')";
    if($conn->query($sql)===TRUE){
        setcookie('phone', $phone, time() + (86400 * 30*1000), "/");
        header("Location: http://192.168.137.1:3000");
    }
    else{
        echo $conn->error;
    }
    $conn->close();
?>